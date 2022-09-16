import { Rank, WarrantStatus, WhitelistStatus } from "@prisma/client";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { Description, Get, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import type * as APITypes from "@snailycad/types/api";
import type { Warrant } from "@snailycad/types";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/name-change-requests")
export class AdminManageWarrantsController {
  @Get("/")
  @Description("Get all pending warrants")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManagePendingWarrants],
  })
  async getRequests() {
    const pendingWarrants = await prisma.warrant.findMany({
      where: { approvalStatus: WhitelistStatus.PENDING },
      include: { citizen: true },
    });

    return pendingWarrants;
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
  ) {
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

    return updated;
  }
}
