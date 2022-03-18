import { ExpungementRequestStatus, Rank } from "@prisma/client";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { Get, Put } from "@tsed/schema";
import { expungementRequestInclude } from "controllers/court/ExpungementRequestsController";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/expungement-requests")
export class AdminManageExpungementRequests {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ViewExpungementRequests, Permissions.ManageExpungementRequests],
  })
  async getRequests() {
    const requests = await prisma.expungementRequest.findMany({
      include: expungementRequestInclude,
    });

    return requests;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageExpungementRequests],
  })
  async updateExpungementRequest(
    @PathParams("id") id: string,
    @BodyParams("type") type: ExpungementRequestStatus,
  ) {
    const isCorrect = Object.values(ExpungementRequestStatus).includes(type);
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
      await prisma.$transaction([
        ...request.warrants.map((warrant) => {
          return prisma.warrant.delete({
            where: { id: warrant.id },
          });
        }),

        ...request.records.map((record) => {
          return prisma.record.delete({
            where: { id: record.id },
          });
        }),
      ]);
    }

    const updated = await prisma.expungementRequest.update({
      where: { id },
      data: {
        status: type,
      },
    });

    return updated;
  }
}
