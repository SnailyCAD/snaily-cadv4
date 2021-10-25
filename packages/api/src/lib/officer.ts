import { Cookie } from "@snailycad/config";
import { Req, Context } from "@tsed/common";
import { BadRequest, Forbidden, Unauthorized } from "@tsed/exceptions";
import { parse } from "cookie";
import { verifyJWT } from "../utils/jwt";
import { getSessionUser } from "./auth";
import { prisma } from "./prisma";

export async function getActiveOfficer(req: Req, userId: string, ctx: Context) {
  const header = req.headers.cookie;
  if (!header) {
    throw new BadRequest("noActiveOfficer");
  }

  const user = await getSessionUser(req);

  if (!user.isDispatch || !user.isLeo) {
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

  const cookie = parse(header)[Cookie.ActiveOfficer];
  const jwtPayload = verifyJWT(cookie!);

  if (!jwtPayload) {
    ctx.delete("activeOfficer");
  }

  if (!isDispatch && !jwtPayload) {
    throw new BadRequest("noActiveOfficer");
  }

  const officer = await prisma.officer.findFirst({
    where: {
      userId,
      id: jwtPayload?.officerId,
    },
    include: {
      rank: true,
      department: true,
      status: {
        include: {
          value: true,
        },
      },
    },
  });

  if (!officer) {
    ctx.delete("activeOfficer");
  }

  if (!isDispatch && !officer) {
    throw new BadRequest("noActiveOfficer");
  }

  return isDispatch ? null : officer;
}
