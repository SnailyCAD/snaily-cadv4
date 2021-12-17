import { User } from ".prisma/client";
import { Cookie } from "@snailycad/config";
import { Req, Context } from "@tsed/common";
import { BadRequest, Forbidden, Unauthorized } from "@tsed/exceptions";
import { parse } from "cookie";
import { verifyJWT } from "../utils/jwt";
import { prisma } from "./prisma";

export const unitProperties = {
  department: { include: { value: true } },
  division: { include: { value: true, department: true } },
  status: { include: { value: true } },
  citizen: { select: { name: true, surname: true, id: true } },
  rank: true,
};

export async function getActiveOfficer(req: Req, user: User, ctx: Context) {
  const header =
    req.cookies[Cookie.ActiveOfficer] || parse(`${req.headers.session}`)?.[Cookie.ActiveOfficer];

  if (!header) {
    throw new BadRequest("noActiveOfficer");
  }

  if (!user.isLeo) {
    throw new Forbidden("Invalid Permissions");
  }

  // dispatch is allowed to use officer routes
  let isDispatch = false;
  if (req.headers["is-from-dispatch"]?.toString() === "true") {
    if (!user.isDispatch) {
      throw new Unauthorized("Must be dispatch to use this header.");
    } else {
      isDispatch = true;
    }
  }

  const jwtPayload = verifyJWT(header);

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
      id: jwtPayload?.officerId ?? "",
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
