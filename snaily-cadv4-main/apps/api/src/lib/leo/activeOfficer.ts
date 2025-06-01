import { type User, type Prisma } from "@prisma/client";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import type { Req, Context } from "@tsed/common";
import { BadRequest, Forbidden } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { getInactivityFilter } from "./utils";
import { combinedUnitProperties, leoProperties } from "utils/leo/includes";

interface GetActiveOfficerOptions {
  ctx: Context;
  user: Pick<User, "rank" | "id" | "permissions">;
  req?: Req;
}

export async function getActiveOfficer(options: GetActiveOfficerOptions) {
  // dispatch is allowed to use officer routes
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
    const hasLeoPermissions = hasPermission({
      userToCheck: options.user,
      permissionsToCheck: defaultPermissions.defaultLeoPermissions,
    });

    if (isAdmin && !hasLeoPermissions) {
      isDispatch = true;
    }

    if (!hasLeoPermissions) {
      throw new Forbidden("Invalid Permissions");
    }
  }

  if (isDispatch) {
    return null;
  }

  const combinedUnit = await prisma.combinedLeoUnit.findFirst({
    where: {
      NOT: { status: { shouldDo: "SET_OFF_DUTY" } },
      officers: { some: { userId: options.user.id } },
    },
    include: combinedUnitProperties,
  });

  const cad = await prisma.cad.findFirst({ include: { miscCadSettings: true } });
  const unitsInactivityFilter = getInactivityFilter(cad!, "unitInactivityTimeout");

  const filters: Prisma.Enumerable<Prisma.OfficerWhereInput> = [
    { status: { shouldDo: "SET_OFF_DUTY" } },
    { status: { is: null } },
  ];

  if (unitsInactivityFilter) {
    filters.push({
      updatedAt: { lte: unitsInactivityFilter.updatedAt },
    });
  }

  const officer = await prisma.officer.findFirst({
    where: {
      userId: options.user.id,
      NOT: { OR: filters },
    },
    include: leoProperties,
  });

  const activeOfficerOrCombinedUnit = combinedUnit ?? officer;

  if (!combinedUnit && !officer) {
    options.ctx.delete("activeOfficer");
    throw new BadRequest("noActiveOfficer");
  }

  return activeOfficerOrCombinedUnit;
}
