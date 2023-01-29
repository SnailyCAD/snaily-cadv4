import { ExpungementRequestStatus, Rank } from "@prisma/client";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { ContentType, Description, Get, Put } from "@tsed/schema";
import { expungementRequestInclude } from "controllers/court/ExpungementRequestsController";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/expungement-requests")
@ContentType("application/json")
export class AdminManageExpungementRequests {
  @Get("/")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ViewExpungementRequests, Permissions.ManageExpungementRequests],
  })
  async getRequests(): Promise<APITypes.GetManageExpungementRequests> {
    const requests = await prisma.expungementRequest.findMany({
      where: { status: ExpungementRequestStatus.PENDING },
      include: expungementRequestInclude,
    });

    return requests;
  }

  @Put("/:id")
  @Description("Accept or decline an expungement request for a citizen.")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageExpungementRequests],
  })
  async updateExpungementRequest(
    @PathParams("id") id: string,
    @BodyParams("type") type: ExpungementRequestStatus,
  ): Promise<APITypes.PutManageExpungementRequests> {
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
      data: { status: type },
    });

    return updated;
  }
}
