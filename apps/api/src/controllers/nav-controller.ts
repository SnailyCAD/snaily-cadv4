import { Controller, Get, UseGuards } from "@nestjs/common";
import { WhitelistStatus } from "@prisma/client";
import { Permissions, defaultPermissions, hasPermission } from "@snailycad/permissions";
import { User } from "@snailycad/types";
import { prisma } from "lib/data/prisma";
import { AuthGuard } from "middlewares/auth/is-auth";
import { UsePermissions } from "middlewares/use-permissions";
import { SessionUser } from "~/decorators/user";
import { Description } from "~/decorators/description";

@Controller("/notifications")
@UseGuards(AuthGuard)
export class NavController {
  @Get("/officer")
  @Description("Get a number of notifications for the officer dropdown for the authenticated user.")
  @UsePermissions({ permissions: defaultPermissions.defaultLeoPermissions })
  async getOfficerNotifications(@SessionUser() user: User) {
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

  @Get("/admin")
  @Description("Get a number of notifications for the admin sidebar for the authenticated user.")
  @UsePermissions({
    permissions: defaultPermissions.allDefaultAdminPermissions,
  })
  async getAdminNotifications(@SessionUser() user: User) {
    const hasManageUnits = hasPermission({
      permissionsToCheck: [Permissions.ManageUnits],
      userToCheck: user,
    });
    const hasManageBusinesses = hasPermission({
      permissionsToCheck: [Permissions.ManageBusinesses],
      userToCheck: user,
    });
    const hasManageNameChange = hasPermission({
      permissionsToCheck: [Permissions.ManageNameChangeRequests],
      userToCheck: user,
    });
    const hasManageExpungementRequest = hasPermission({
      permissionsToCheck: [Permissions.ManageExpungementRequests],
      userToCheck: user,
    });
    const hasManageWarrants = hasPermission({
      permissionsToCheck: [Permissions.ManagePendingWarrants],
      userToCheck: user,
    });

    const [
      pendingUnitsForDepartments,
      pendingBusinesses,
      pendingNameChangeRequests,
      pendingExpungementRequests,
      pendingWarrants,
    ] = await prisma.$transaction([
      prisma.officer.count({ where: { whitelistStatus: { status: WhitelistStatus.PENDING } } }),
      prisma.business.count({ where: { status: WhitelistStatus.PENDING } }),
      prisma.nameChangeRequest.count({ where: { status: WhitelistStatus.PENDING } }),
      prisma.expungementRequest.count({ where: { status: WhitelistStatus.PENDING } }),
      prisma.warrant.count({ where: { approvalStatus: WhitelistStatus.PENDING } }),
    ]);

    return {
      pendingUnitsForDepartments: hasManageUnits ? pendingUnitsForDepartments : 0,
      pendingBusinesses: hasManageBusinesses ? pendingBusinesses : 0,
      pendingNameChangeRequests: hasManageNameChange ? pendingNameChangeRequests : 0,
      pendingExpungementRequests: hasManageExpungementRequest ? pendingExpungementRequests : 0,
      pendingWarrants: hasManageWarrants ? pendingWarrants : 0,
    };
  }
}
