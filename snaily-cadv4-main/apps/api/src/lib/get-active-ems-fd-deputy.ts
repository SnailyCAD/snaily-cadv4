import { type Prisma, ShouldDoType, type User } from "@prisma/client";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import type { Req, Context } from "@tsed/common";
import { BadRequest, Forbidden } from "@tsed/exceptions";
import { combinedEmsFdUnitProperties, unitProperties } from "utils/leo/includes";
import { getInactivityFilter } from "./leo/utils";
import { prisma } from "./data/prisma";

interface GetActiveDeputyOptions {
  ctx: Context;
  user: Pick<User, "rank" | "id" | "permissions">;
  req?: Req;
}

export async function getActiveDeputy(options: GetActiveDeputyOptions) {
  // dispatch is allowed to use ems-fd routes
  let isDispatch = false;
  const isAdmin = hasPermission({
    userToCheck: options.user,
    permissionsToCheck: defaultPermissions.allDefaultAdminPermissions,
  });

  if (options.req?.headers["is-from-dispatch"]?.toString() === "true") {
    const hasDispatchPermissions = hasPermission({
      userToCheck: options.user,
      permissionsToCheck: defaultPermissions.defaultDispatchPermissions,
    });

    if (isAdmin && !hasDispatchPermissions) {
      isDispatch = true;
    }

    if (!hasDispatchPermissions) {
      throw new Forbidden("Must be dispatch to use this header.");
    } else {
      isDispatch = true;
    }
  } else {
    const hasEmsFdPermissions = hasPermission({
      userToCheck: options.user,
      permissionsToCheck: defaultPermissions.defaultEmsFdPermissions,
    });

    if (isAdmin && !hasEmsFdPermissions) {
      isDispatch = true;
    }

    if (!hasEmsFdPermissions) {
      throw new Forbidden("Invalid Permissions");
    }
  }

  if (isDispatch) {
    return null;
  }

  const combinedUnit = await prisma.combinedEmsFdUnit.findFirst({
    where: {
      NOT: { status: { shouldDo: "SET_OFF_DUTY" } },
      deputies: { some: { userId: options.user.id } },
    },
    include: combinedEmsFdUnitProperties,
  });

  const cad = await prisma.cad.findFirst({ include: { miscCadSettings: true } });
  const unitsInactivityFilter = getInactivityFilter(cad!, "unitInactivityTimeout");

  const filters: Prisma.Enumerable<Prisma.EmsFdDeputyWhereInput> = [
    { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
    { status: { is: null } },
  ];

  if (unitsInactivityFilter) {
    filters.push({
      updatedAt: { lte: unitsInactivityFilter.updatedAt },
    });
  }

  const deputy = await prisma.emsFdDeputy.findFirst({
    where: {
      userId: options.user.id,
      NOT: { OR: filters },
    },
    include: unitProperties,
  });

  const activeDeputyOrCombinedUnit = combinedUnit ?? deputy;

  if (!activeDeputyOrCombinedUnit) {
    options.ctx.delete("activeDeputy");
    throw new BadRequest("noActiveDeputy");
  }

  return activeDeputyOrCombinedUnit;
}
