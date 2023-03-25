import { Rank, WhitelistStatus } from "@prisma/client";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { ContentType, Description, Get, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";
import { AuditLogActionType } from "@snailycad/audit-logger";
import { createAuditLogEntry } from "@snailycad/audit-logger/server";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/name-change-requests")
@ContentType("application/json")
export class AdminNameChangeController {
  @Get("/")
  @Description("Get all the name change requests")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ViewNameChangeRequests, Permissions.ManageNameChangeRequests],
  })
  async getRequests(): Promise<APITypes.GetManageNameChangeRequests> {
    const [totalCount, pendingNameChangeRequests] = await prisma.$transaction([
      prisma.nameChangeRequest.count({ where: { status: WhitelistStatus.PENDING } }),
      prisma.nameChangeRequest.findMany({
        where: { status: WhitelistStatus.PENDING },
        include: { citizen: true },
      }),
    ]);

    return { pendingNameChangeRequests, totalCount };
  }

  @Put("/:id")
  @Description("Accept or decline a name change request.")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageNameChangeRequests],
  })
  async acceptOrDeclineNameChangeRequest(
    @PathParams("id") id: string,
    @BodyParams("type") type: WhitelistStatus,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PutManageNameChangeRequests> {
    const isCorrect = Object.values(WhitelistStatus).includes(type);
    if (!isCorrect) {
      throw new BadRequest("invalidType");
    }

    const request = await prisma.nameChangeRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFound("requestNotFound");
    }

    if (type === WhitelistStatus.ACCEPTED) {
      await prisma.citizen.update({
        where: { id: request.citizenId },
        data: {
          name: request.newName ?? undefined,
          surname: request.newSurname ?? undefined,
        },
      });
    }

    const updated = await prisma.nameChangeRequest.update({
      where: { id },
      data: {
        status: type,
      },
      include: { citizen: true },
    });

    const auditLogType =
      type === WhitelistStatus.ACCEPTED
        ? AuditLogActionType.NameChangeRequestAccepted
        : AuditLogActionType.NameChangeRequestDeclined;
    const translationKey =
      type === WhitelistStatus.ACCEPTED ? "nameChangeRequestAccepted" : "nameChangeRequestDeclined";

    await createAuditLogEntry({
      translationKey,
      action: {
        type: auditLogType,
        new: { ...updated, id: updated.citizenId },
      },
      prisma,
      executorId: sessionUserId,
    });

    return updated;
  }
}
