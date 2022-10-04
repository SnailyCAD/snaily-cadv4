import { Prisma, ShouldDoType, User } from "@prisma/client";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { Rank } from "@snailycad/types";
import type { Req, Context } from "@tsed/common";
import { BadRequest, Forbidden } from "@tsed/exceptions";
import { unitProperties } from "lib/leo/activeOfficer";
import { getInactivityFilter } from "./leo/utils";
import { prisma } from "./prisma";

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
    fallback: (u) => u.rank !== Rank.USER,
  });

  if (isAdmin) {
    return null;
  }

  if (options.req?.headers["is-from-dispatch"]?.toString() === "true") {
    const hasDispatchPermissions = hasPermission({
      userToCheck: options.user,
      permissionsToCheck: defaultPermissions.defaultDispatchPermissions,
      fallback: (user) => user.isDispatch,
    });

    if (!hasDispatchPermissions) {
      throw new Forbidden("Must be dispatch to use this header.");
    } else {
      isDispatch = true;
    }
  } else {
    const hasEmsFdPermissions = hasPermission({
      userToCheck: options.user,
      permissionsToCheck: defaultPermissions.defaultEmsFdPermissions,
      fallback: (user) => user.isEmsFd,
    });

    if (!hasEmsFdPermissions) {
      throw new Forbidden("Invalid EMS-FD Permissions");
    }
  }

  if (isDispatch) {
    return null;
  }

  const cad = await prisma.cad.findFirst({ include: { miscCadSettings: true } });
  const unitsInactivityFilter = getInactivityFilter(
    cad!,
    "unitInactivityTimeout",
    "lastStatusChangeTimestamp",
  );

  const filters: Prisma.Enumerable<Prisma.EmsFdDeputyWhereInput> = [
    { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
    { status: { is: null } },
  ];

  if (unitsInactivityFilter) {
    filters.push({
      lastStatusChangeTimestamp: { lte: unitsInactivityFilter.lastStatusChangeTimestamp },
    });
  }

  const deputy = await prisma.emsFdDeputy.findFirst({
    where: {
      userId: options.user.id,
      NOT: { OR: filters },
    },
    include: unitProperties,
  });

  if (!deputy) {
    options.ctx.delete("activeDeputy");
    throw new BadRequest("noActiveDeputy");
  }

  return deputy;
}
