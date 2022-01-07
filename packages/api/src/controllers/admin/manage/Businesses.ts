import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, Get, JsonRequestBody, Put } from "@tsed/schema";
import { userProperties } from "lib/auth";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";

const businessInclude = {
  citizen: {
    select: {
      name: true,
      surname: true,
      id: true,
    },
  },
  user: {
    select: userProperties,
  },
};

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/businesses")
export class ManageBusinessesController {
  @Get("/")
  async getBusinesses() {
    const businesses = await prisma.business.findMany({ include: businessInclude });

    return businesses;
  }

  @Put("/:id")
  async updateBusiness(@BodyParams() body: JsonRequestBody, @PathParams("id") businessId: string) {
    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!business) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.business.update({
      where: { id: businessId },
      data: { status: body.get("status") },
      include: businessInclude,
    });

    return updated;
  }

  @Delete("/:id")
  async deleteBusiness(
    @Context() ctx: Context,
    @BodyParams() body: JsonRequestBody,
    @PathParams("id") businessId: string,
  ) {
    const reason = body.get("reason");

    const business = await prisma.business.findUnique({
      where: {
        id: businessId,
      },
    });

    if (!business) {
      throw new NotFound("notFound");
    }

    await prisma.notification.create({
      data: {
        userId: business.userId,
        executorId: ctx.get("user").id,
        description: reason,
        title: "BUSINESS_DELETED",
      },
    });

    await prisma.business.delete({
      where: {
        id: businessId,
      },
    });

    return true;
  }
}
