import { Req } from "@tsed/common";
import { NotFound, Unauthorized } from "@tsed/exceptions";
import { parse } from "cookie";
import { Cookie } from "@snailycad/config";
import { verifyJWT } from "utils/jwt";
import { prisma } from "./prisma";
import { User } from ".prisma/client";

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
  statusViewMode: true,
  discordId: true,
};

export async function getSessionUser(req: Req, throwErrors = false): Promise<User> {
  const header = req.cookies[Cookie.Session] || parse(`${req.headers.session}`)?.[Cookie.Session];

  if (throwErrors && !header) {
    throw new Unauthorized("Unauthorized");
  }

  const jwtPayload = verifyJWT(header);

  if (throwErrors && !jwtPayload) {
    throw new Unauthorized("Unauthorized");
  }

  const user = jwtPayload
    ? await prisma.user.findUnique({
        where: {
          id: jwtPayload?.userId,
        },
        select: userProperties,
      })
    : null;

  if (!throwErrors && !user) {
    return null as unknown as User;
  }

  if (throwErrors && !user) {
    throw new NotFound("notFound");
  }

  const { tempPassword, ...rest } = user! ?? {};
  return { ...rest, tempPassword: null, hasTempPassword: !!tempPassword } as unknown as User;
}
