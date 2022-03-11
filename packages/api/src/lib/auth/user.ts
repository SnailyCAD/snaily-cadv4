import process from "node:process";
import type { Req } from "@tsed/common";
import { NotFound, Unauthorized } from "@tsed/exceptions";
import { parse } from "cookie";
import { Cookie } from "@snailycad/config";
import { verifyJWT } from "utils/jwt";
import { prisma } from "lib/prisma";
import { WhitelistStatus, type User } from "@prisma/client";

export const userProperties = {
  id: true,
  username: true,
  rank: true,
  isLeo: true,
  isSupervisor: true,
  isEmsFd: true,
  isDispatch: true,
  isTow: true,
  isTaxi: true,
  banned: true,
  banReason: true,
  avatarUrl: true,
  steamId: true,
  whitelistStatus: true,
  isDarkTheme: true,
  tempPassword: true,
  statusViewMode: true,
  discordId: true,
  tableActionsAlignment: true,
  lastDiscordSyncTimestamp: true,
  soundSettingsId: true,
  soundSettings: true,
};

export async function getSessionUser(req: Req, throwErrors?: true): Promise<User>;
export async function getSessionUser(req: Req, throwErrors?: false): Promise<User | null>;
export async function getSessionUser(req: Req, throwErrors = false): Promise<User | null> {
  let header = req.cookies[Cookie.Session] || parse(`${req.headers.session}`)[Cookie.Session];

  if (process.env.IFRAME_SUPPORT_ENABLED === "true" && !header) {
    const name = "snaily-cad-iframe-cookie";
    header = req.cookies[name] || parse(`${req.headers.session}`)[name];
  }

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

  if (throwErrors && user?.banned) {
    throw new NotFound("userBanned");
  }

  if (throwErrors && user?.whitelistStatus === WhitelistStatus.PENDING) {
    throw new NotFound("whitelistPending");
  }

  if (throwErrors && user?.whitelistStatus === WhitelistStatus.DECLINED) {
    throw new NotFound("whitelistDeclined");
  }

  const { tempPassword, ...rest } = user ?? {};
  return { ...rest, tempPassword: null, hasTempPassword: !!tempPassword } as unknown as User;
}

export function canManageInvariant<T extends Error>(
  userId: string | null | undefined,
  authUser: User,
  error: T,
): asserts userId {
  if (!userId && (authUser.rank as string) !== "API_TOKEN") {
    throw error;
  }

  if ((authUser.rank as string) !== "API_TOKEN" && userId && userId !== authUser.id) {
    throw error;
  }
}
