import { Rank } from "@prisma/client";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, Description, Get, Put } from "@tsed/schema";
import { userProperties } from "lib/auth/getSessionUser";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

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
export class AdminManageBusinessesController {
  @Get("/")
  @Description("Get all the businesses within the CAD")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [
      Permissions.ViewBusinesses,
      Permissions.DeleteBusinesses,
      Permissions.ManageBusinesses,
    ],
  })
  async getBusinesses() {
    const businesses = await prisma.business.findMany({ include: businessInclude });

    return businesses;
  }

  @Put("/:id")
  @Description("Update a business by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageBusinesses],
  })
  async updateBusiness(@BodyParams() body: any, @PathParams("id") businessId: string) {
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
      data: { status: body.status },
      include: businessInclude,
    });

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a business by its id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.DeleteBusinesses],
  })
  async deleteBusiness(
    @Context() ctx: Context,
    @BodyParams() body: any,
    @PathParams("id") businessId: string,
  ) {
    const reason = body.reason;

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
