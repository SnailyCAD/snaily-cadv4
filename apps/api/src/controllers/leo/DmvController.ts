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

const vehicleInclude = {
  model: { include: { value: true } },
  registrationStatus: true,
  insuranceStatus: true,
  citizen: true,
};

@Controller("/leo/dmv")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.DMV })
export class DmvController {
  @Get("/")
  @Description("Get pending vehicles for the dmv")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.ManageDMV],
  })
  async getPendingVehicles(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetDMVPendingVehiclesData> {
    const [totalCount, vehicles] = await prisma.$transaction([
      prisma.registeredVehicle.count({ where: { dmvStatus: { not: null } } }),
      prisma.registeredVehicle.findMany({
        where: { dmvStatus: { not: null } },
        include: vehicleInclude,
        orderBy: { createdAt: "desc" },
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
      }),
    ]);

    return { vehicles, totalCount };
  }
  @Post("/:vehicleId")
  @Description("Accept or decline a pending vehicle in the dmv")
  async acceptOrDeclineVehicle(
    @PathParams("vehicleId") vehicleId: string,
    @BodyParams("type") type: AcceptDeclineType,
  ): Promise<APITypes.PostDMVVehiclesData> {
    const vehicle = await prisma.registeredVehicle.findFirst({
      where: { id: vehicleId, dmvStatus: WhitelistStatus.PENDING },
    });

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    if (!ACCEPT_DECLINE_TYPES.includes(type)) {
      throw new BadRequest("invalidType.");
    }

    const dmvStatus = type === "ACCEPT" ? WhitelistStatus.ACCEPTED : WhitelistStatus.DECLINED;
    const updated = await prisma.registeredVehicle.update({
      where: { id: vehicle.id },
      data: { dmvStatus },
      include: vehicleInclude,
    });

    return updated;
  }
}
