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
  isDarkTheme: true,
  tempPassword: true,
};

export async function getSessionUser(req: Req, throwErrors = false) {
  const header = req.headers.cookie;

  if (throwErrors && !header) {
    throw new Unauthorized("Unauthorized");
  }

  const cookie = parse(header ?? "")[Cookie.Session];
  const jwtPayload = verifyJWT(cookie!);

  if (throwErrors && !jwtPayload) {
    throw new Unauthorized("Unauthorized");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: jwtPayload?.userId ?? "0000000",
    },
    select: userProperties,
  });

  if (!throwErrors && !user) return null as unknown as any;

  if (throwErrors && !user) {
    throw new NotFound("notFound");
  }

  const { tempPassword, ...rest } = user! ?? {};
  return { ...rest, hasTempPassword: !!tempPassword };
}
