import { Cookie } from "@snailycad/config";
import { Req, Context } from "@tsed/common";
import { BadRequest, Forbidden, Unauthorized } from "@tsed/exceptions";
import { parse } from "cookie";
import { verifyJWT } from "../utils/jwt";
import { getSessionUser } from "./auth";
import { unitProperties } from "./officer";
import { prisma } from "./prisma";

export async function getActiveDeputy(req: Req, userId: string, ctx: Context) {
  const header =
    req.cookies[Cookie.ActiveDeputy] || parse(`${req.headers.session}`)?.[Cookie.ActiveDeputy];

  if (!header) {
    throw new BadRequest("noActiveDeputy");
  }

  const user = await getSessionUser(req);

  if (!user.isDispatch || !user.isEmsFd) {
    throw new Forbidden("Invalid Permissions");
  }

  // dispatch is allowed to use ems-fd routes
  let isDispatch = false;
  if (req.headers["is-from-dispatch"]?.toString() === "true") {
    if (!user.isDispatch) {
      throw new Unauthorized("Must be dispatch to use this header.");
    } else {
      isDispatch = true;
    }
  }

  const jwtPayload = verifyJWT(header);
  if (!jwtPayload) {
    ctx.delete("activeDeputy");
  }

  if (!isDispatch && !jwtPayload) {
    throw new BadRequest("noActiveDeputy");
  }

  const deputy = await prisma.emsFdDeputy.findFirst({
    where: {
      userId,
      id: jwtPayload?.deputyId,
    },
    include: unitProperties,
  });

  if (!deputy) {
    ctx.delete("activeDeputy");
  }

  if (!isDispatch && !deputy) {
    throw new BadRequest("noActiveDeputy");
  }

  return isDispatch ? null : deputy;
}
