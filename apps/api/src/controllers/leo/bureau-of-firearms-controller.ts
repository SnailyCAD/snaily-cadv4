import { WhitelistStatus } from "@prisma/client";
import { BodyParams, PathParams, QueryParams, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ContentType, Description, Get, Post } from "@tsed/schema";
import {
  AcceptDeclineType,
  ACCEPT_DECLINE_TYPES,
} from "controllers/admin/manage/units/manage-units-controller";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled, Feature } from "middlewares/is-enabled";
import { citizenInclude } from "controllers/citizen/CitizenController";

@Controller("/leo/bureau-of-firearms")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.BUREAU_OF_FIREARMS })
export class BureauOfFirearmsController {
  @Get("/")
  @Description("Get pending weapons for the BOF")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.ManageBureauOfFirearms],
  })
  async getPendingWeapons(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetPendingBOFWeapons> {
    const [totalCount, weapons] = await prisma.$transaction([
      prisma.weapon.count({ where: { bofStatus: { not: null } } }),
      prisma.weapon.findMany({
        where: { bofStatus: { not: null } },
        include: {
          ...citizenInclude.weapons.include,
          citizen: true,
        },
        orderBy: { createdAt: "desc" },
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
      }),
    ]);

    return { weapons, totalCount };
  }
  @Post("/:weaponId")
  @Description("Accept or decline a pending weapon in the BOF")
  async acceptOrDeclineWeapon(
    @PathParams("weaponId") weaponId: string,
    @BodyParams("type") type: AcceptDeclineType,
  ): Promise<APITypes.PostBOFData> {
    const weapon = await prisma.weapon.findFirst({
      where: { id: weaponId, bofStatus: WhitelistStatus.PENDING },
    });

    if (!weapon) {
      throw new NotFound("weaponNotFound");
    }

    if (!ACCEPT_DECLINE_TYPES.includes(type)) {
      throw new BadRequest("invalidType.");
    }

    const bofStatus = type === "ACCEPT" ? WhitelistStatus.ACCEPTED : WhitelistStatus.DECLINED;
    const updated = await prisma.weapon.update({
      where: { id: weapon.id },
      data: { bofStatus },
      include: {
        ...citizenInclude.weapons.include,
        citizen: true,
      },
    });

    return updated;
  }
}
