import { Req } from "@tsed/common";
import { NotFound, Unauthorized } from "@tsed/exceptions";
import { parse } from "cookie";
import { Cookie } from "@snailycad/config";
import { verifyJWT } from "../utils/jwt";
import { prisma } from "./prisma";

export const userProperties = {
  id: true,
  username: true,
  rank: true,
  isLeo: true,
  isSupervisor: true,
  isEmsFd: true,
  isDispatch: true,
  isTow: true,
  banned: true,
  banReason: true,
  avatarUrl: true,
  steamId: true,
  whitelistStatus: true,
};

export async function getSessionUser(req: Req) {
  const header = req.headers.cookie;

  if (!header) {
    throw new Unauthorized("Unauthorized");
  }

  const cookie = parse(header)[Cookie.Session];
  const jwtPayload = verifyJWT(cookie!);

  if (!jwtPayload) {
    throw new Unauthorized("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: jwtPayload.userId,
    },
    select: userProperties,
  });

  if (!user) {
    throw new NotFound("notFound");
  }

  return user;
}
