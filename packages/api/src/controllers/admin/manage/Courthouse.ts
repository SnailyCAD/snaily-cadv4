import { ExpungementRequestStatus } from "@prisma/client";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, Get, JsonRequestBody, Put } from "@tsed/schema";
import { expungementRequestInclude } from "controllers/court/CourtController";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/expungement-requests")
export class ManageCourthouseController {
  @Get("/")
  async getRequests() {
    const requests = await prisma.expungementRequest.findMany({
      include: expungementRequestInclude,
    });

    return requests;
  }

  @Put("/:id")
  async updateExpungementRequest(
    @PathParams("id") id: string,
    @BodyParams("type") type: ExpungementRequestStatus,
  ) {
    const isCorrect = Object.values(ExpungementRequestStatus).some((v) => v === type);

    if (!isCorrect) {
      throw new BadRequest("invalidType");
    }

    const request = await prisma.expungementRequest.findUnique({
      where: { id },
      include: expungementRequestInclude,
    });

    if (!request) {
      throw new NotFound("requestNotFound");
    }

    if (type === ExpungementRequestStatus.ACCEPTED) {
      await Promise.all(
        request.warrants?.map(async (warrant) => {
          await prisma.warrant.delete({
            where: { id: warrant.id },
          });
        }),
      );

      await Promise.all(
        request.records?.map(async (record) => {
          await prisma.record.delete({
            where: { id: record.id },
          });
        }),
      );
    }

    const updated = await prisma.expungementRequest.update({
      where: { id },
      data: {
        status: type,
      },
    });

    return updated;
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
