import { WhitelistStatus } from "@prisma/client";
import { Permissions, hasPermission } from "@snailycad/permissions";
import { User } from "@snailycad/types";
import { Context, UseBeforeEach } from "@tsed/common";
import { Controller } from "@tsed/di";
import { Description, Get } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";

@Controller("/notifications")
@UseBeforeEach(IsAuth)
export class NavController {
  @Get("/officer")
  @Description("Get a number of notifications for the officer dropdown for the authenticated user.")
  async getOfficerNotifications(@Context("user") user: User) {
    const hasManageBureauOfFirearms = hasPermission({
      permissionsToCheck: [Permissions.ManageBureauOfFirearms],
      userToCheck: user,
    });
    const hasManageDMV = hasPermission({
      permissionsToCheck: [Permissions.ManageDMV],
      userToCheck: user,
    });

    const [pendingWeapons, pendingVehicles] = await prisma.$transaction([
      prisma.weapon.count({ where: { bofStatus: WhitelistStatus.PENDING } }),
      prisma.registeredVehicle.count({ where: { dmvStatus: WhitelistStatus.PENDING } }),
    ]);

    return {
      pendingWeapons: hasManageBureauOfFirearms ? pendingWeapons : 0,
      pendingVehicles: hasManageDMV ? pendingVehicles : 0,
    };
  }
}
