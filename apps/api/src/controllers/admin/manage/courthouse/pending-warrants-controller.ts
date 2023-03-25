import { Rank, Warrant, WarrantStatus, WhitelistStatus } from "@prisma/client";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { ContentType, Description, Get, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";
import { assignedOfficersInclude } from "controllers/record/records-controller";
import { leoProperties } from "lib/leo/activeOfficer";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { AuditLogActionType } from "@snailycad/audit-logger";
import { createAuditLogEntry } from "@snailycad/audit-logger/server";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/pending-warrants")
@ContentType("application/json")
export class AdminManageWarrantsController {
  @Get("/")
  @Description("Get all pending warrants")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManagePendingWarrants],
  })
  async getPendingWarrants(): Promise<APITypes.GetManagePendingWarrants> {
    const [totalCount, pendingWarrants] = await prisma.$transaction([
      prisma.warrant.count({ where: { approvalStatus: WhitelistStatus.PENDING } }),
      prisma.warrant.findMany({
        where: { approvalStatus: WhitelistStatus.PENDING },
        include: {
          citizen: true,
          assignedOfficers: { include: assignedOfficersInclude },
          officer: { include: leoProperties },
        },
      }),
    ]);

    return {
      pendingWarrants: pendingWarrants.map((v) => officerOrDeputyToUnit(v)),
      totalCount,
    };
  }

  @Put("/:id")
  @Description("Sign a warrant as active.")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManagePendingWarrants],
  })
  async acceptOrDeclineNameChangeRequest(
    @PathParams("id") id: string,
    @BodyParams("type") type: WhitelistStatus,
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.PutManagePendingWarrants> {
    const isCorrect = Object.values(WhitelistStatus).includes(type);
    if (!isCorrect) {
      throw new BadRequest("invalidType");
    }

    const warrant = await prisma.warrant.findUnique({
      where: { id },
    });

    if (!warrant) {
      throw new NotFound("warrantNotFound");
    }

    let updated: Warrant;
    if (type === WhitelistStatus.ACCEPTED) {
      updated = await prisma.warrant.update({
        where: { id: warrant.id },
        data: {
          status: WarrantStatus.ACTIVE,
          approvalStatus: WhitelistStatus.ACCEPTED,
        },
      });
    } else {
      updated = await prisma.warrant.update({
        where: { id: warrant.id },
        data: {
          status: WarrantStatus.INACTIVE,
          approvalStatus: WhitelistStatus.DECLINED,
        },
      });
    }

    const auditLogType =
      type === WhitelistStatus.ACCEPTED
        ? AuditLogActionType.ActiveWarrantAccepted
        : AuditLogActionType.ActiveWarrantDeclined;
    const translationKey =
      type === WhitelistStatus.ACCEPTED ? "activeWarrantAccepted" : "activeWarrantDeclined";

    await createAuditLogEntry({
      translationKey,
      action: {
        type: auditLogType,
        new: updated,
      },
      prisma,
      executorId: sessionUserId,
    });

    return true;
  }
}
