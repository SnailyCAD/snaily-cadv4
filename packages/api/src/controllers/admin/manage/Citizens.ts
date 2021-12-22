import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, Get, JsonRequestBody } from "@tsed/schema";
import { userProperties } from "lib/auth";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/citizens")
export class ManageCitizensController {
  @Get("/")
  async getCitizens() {
    const citizens = await prisma.citizen.findMany({
      include: {
        user: {
          select: userProperties,
        },
        gender: true,
        ethnicity: true,
      },
    });

    return citizens;
  }

  @Delete("/:id")
  async deleteCitizen(
    @Context() ctx: Context,
    @BodyParams() body: JsonRequestBody,
    @PathParams("id") citizenId: string,
  ) {
    const reason = body.get("reason");

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    await prisma.notification.create({
      data: {
        userId: citizen.userId,
        executorId: ctx.get("user").id,
        description: reason,
        title: "CITIZEN_DELETED",
      },
    });

    await prisma.citizen.delete({
      where: {
        id: citizenId,
      },
    });

    return true;
  }
}
