import type { User } from ".prisma/client";
import type { Req, Context } from "@tsed/common";
import { BadRequest, Forbidden, Unauthorized } from "@tsed/exceptions";
import { userProperties } from "./auth/user";
import { prisma } from "./prisma";

export const unitProperties = {
  department: { include: { value: true } },
  division: { include: { value: true, department: true } },
  status: { include: { value: true } },
  citizen: { select: { name: true, surname: true, id: true } },
  user: { select: userProperties },
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
  rank: true,
};

export const leoProperties = {
  ..._leoProperties,
  activeIncident: { include: { officersInvolved: { include: _leoProperties }, events: true } },
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
    if (!user.isLeo) {
      throw new Forbidden("Invalid Permissions");
    }
  }

  const combinedUnit = await prisma.combinedLeoUnit.findFirst({
    where: {
      NOT: { status: { shouldDo: "SET_OFF_DUTY" } },
      officers: { some: { userId: user.id } },
    },
    include: { status: { include: { value: true } }, officers: { include: unitProperties } },
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
    include: unitProperties,
  });

  const off = combinedUnit ?? officer;

  if (!off) {
    ctx.delete("activeOfficer");
  }

  if (!off && !isDispatch) {
    throw new BadRequest("noActiveOfficer");
  }

  return isDispatch ? null : off;
}
