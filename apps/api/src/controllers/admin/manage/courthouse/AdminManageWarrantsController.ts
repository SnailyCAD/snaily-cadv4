import { Rank, WarrantStatus, WhitelistStatus } from "@prisma/client";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { ContentType, Description, Get, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";
import { assignedOfficersInclude } from "controllers/record/records-controller";
import { leoProperties } from "lib/leo/activeOfficer";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";

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
    const pendingWarrants = await prisma.warrant.findMany({
      where: { approvalStatus: WhitelistStatus.PENDING },
      include: {
        citizen: true,
        assignedOfficers: { include: assignedOfficersInclude },
        officer: { include: leoProperties },
      },
    });

    return pendingWarrants.map((v) => officerOrDeputyToUnit(v));
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

    if (type === WhitelistStatus.ACCEPTED) {
      await prisma.warrant.update({
        where: { id: warrant.id },
        data: {
          status: WarrantStatus.ACTIVE,
          approvalStatus: WhitelistStatus.ACCEPTED,
        },
      });
    } else {
      await prisma.warrant.update({
        where: { id: warrant.id },
        data: {
          status: WarrantStatus.INACTIVE,
          approvalStatus: WhitelistStatus.DECLINED,
        },
      });
    }

    return true;
  }
}
