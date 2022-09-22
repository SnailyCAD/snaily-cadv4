import { WhitelistStatus } from "@prisma/client";
import { BodyParams, PathParams, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ContentType, Description, Get, Post } from "@tsed/schema";
import {
  AcceptDeclineType,
  ACCEPT_DECLINE_TYPES,
} from "controllers/admin/manage/AdminManageUnitsController";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import type * as APITypes from "@snailycad/types/api";

const vehicleInclude = {
  model: { include: { value: true } },
  registrationStatus: true,
  insuranceStatus: true,
  citizen: true,
};

@Controller("/leo/dmv")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class DmvController {
  @Get("/")
  @Description("Get pending vehicles for the dmv")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.ManageDMV],
  })
  async getPendingVehicles(): Promise<APITypes.GetDMVPendingVehiclesData> {
    const vehicles = await prisma.registeredVehicle.findMany({
      where: { dmvStatus: WhitelistStatus.PENDING },
      include: vehicleInclude,
      orderBy: { createdAt: "desc" },
    });

    return vehicles;
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
