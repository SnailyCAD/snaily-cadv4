import type { User } from "@prisma/client";
import { hasPermission, Permissions } from "@snailycad/permissions";
import type { Req, Context } from "@tsed/common";
import { BadRequest, Forbidden, Unauthorized } from "@tsed/exceptions";
import { userProperties } from "lib/auth/user";
import { prisma } from "lib/prisma";

export const unitProperties = {
  department: { include: { value: true } },
  division: { include: { value: true, department: true } },
  status: { include: { value: true } },
  citizen: { select: { name: true, surname: true, id: true } },
  user: { select: userProperties },
  AssignedUnit: { where: { call911: { ended: false } } },
  rank: true,
};

export const _leoProperties = {
  department: { include: { value: true } },
  division: { include: { value: true, department: true } },
  divisions: { include: { value: true, department: true } },
  status: { include: { value: true } },
  citizen: { select: { name: true, surname: true, id: true } },
  whitelistStatus: { include: { department: { include: { value: true } } } },
  user: { select: userProperties },
  assignedUnit: { where: { call911: { ended: false } } },
  LeoIncidentInvolvedOfficers: { select: { id: true }, where: { isActive: true } },
  rank: true,
};

export const leoProperties = {
  ..._leoProperties,
  activeIncident: {
    include: { unitsInvolved: { include: { officer: { include: _leoProperties } } }, events: true },
  },
};

export const combinedUnitProperties = {
  status: { include: { value: true } },
  officers: { include: _leoProperties },
};

export async function getActiveOfficer(req: Req, user: User, ctx: Context) {
  // dispatch is allowed to use officer routes
  let isDispatch = false;
  if (req.headers["is-from-dispatch"]?.toString() === "true") {
    if (!user.isDispatch) {
      throw new Unauthorized("Must be dispatch to use this header.");
    } else {
      isDispatch = true;
    }
  } else {
    const hasLeoPermissions = !user.permissions.length
      ? user.isLeo
      : hasPermission(user.permissions, [Permissions.Leo]);

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
      officers: { some: { userId: user.id } },
    },
    include: combinedUnitProperties,
  });

  const officer = await prisma.officer.findFirst({
    where: {
      userId: user.id,
      NOT: {
        OR: [
          {
            status: {
              shouldDo: "SET_OFF_DUTY",
            },
          },
          {
            status: {
              is: null,
            },
          },
        ],
      },
    },
    include: leoProperties,
  });

  const activeOfficerOrCombinedUnit = combinedUnit ?? officer;

  if (!activeOfficerOrCombinedUnit) {
    ctx.delete("activeOfficer");
    throw new BadRequest("noActiveOfficer");
  }

  return activeOfficerOrCombinedUnit;
}
