import { Cookie } from "@snailycad/config";
import { Req, Context } from "@tsed/common";
import { BadRequest, Forbidden, Unauthorized } from "@tsed/exceptions";
import { parse } from "cookie";
import { verifyJWT } from "../utils/jwt";
import { getSessionUser } from "./auth";
import { prisma } from "./prisma";

export async function getActiveDeputy(req: Req, userId: string, ctx: Context) {
  const header = req.headers.cookie;
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

  const cookie = parse(header)[Cookie.ActiveDeputy];
  const jwtPayload = verifyJWT(cookie!);

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
    include: {
      rank: true,
      department: { include: { value: true } },
      status: { include: { value: true } },
      division: { include: { value: true } },
    },
  });

  if (!deputy) {
    ctx.delete("activeDeputy");
  }

  if (!isDispatch && !deputy) {
    throw new BadRequest("noActiveDeputy");
  }

  return isDispatch ? null : deputy;
}
