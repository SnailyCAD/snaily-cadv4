import process from "node:process";
import type { Req } from "@tsed/common";
import { Forbidden, NotFound, Unauthorized } from "@tsed/exceptions";
import { parse } from "cookie";
import { Cookie, USER_API_TOKEN_HEADER } from "@snailycad/config";
import { verifyJWT } from "utils/jwt";
import { prisma } from "lib/prisma";
import { Feature, WhitelistStatus, type User } from "@prisma/client";
import { isFeatureEnabled } from "lib/cad";
import { hasPermission, Permissions } from "@snailycad/permissions";
import type { GetUserData } from "@snailycad/types/api";

enum GetSessionUserErrors {
  InvalidAPIToken = "invalid user API token",
  InvalidPermissionsForUserAPIToken = "invalid permissions for user API Token",
  Unauthorized = "Unauthorized",
  NotFound = "NotFound",
  UserBanned = "userBanned",
  WhitelistPending = "whitelistPending",
  WhitelistDeclined = "whitelistDeclined",
}

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
  permissions: true,
  apiToken: true,
  apiTokenId: true,
  roles: true,
  locale: true,
};

export async function getSessionUser(req: Req, returnNullOnError?: false): Promise<GetUserData>;
export async function getSessionUser(
  req: Req,
  returnNullOnError?: true,
): Promise<GetUserData | null>;
export async function getSessionUser(
  req: Req,
  returnNullOnError = false,
): Promise<GetUserData | null> {
  let header = req.cookies[Cookie.Session] || parse(String(req.headers.session))[Cookie.Session];

  const cad = await prisma.cad.findFirst({ select: { features: true } });
  const isUserAPITokensEnabled = isFeatureEnabled({
    feature: Feature.USER_API_TOKENS,
    features: cad?.features,
    defaultReturn: false,
  });

  let userApiTokenHeader;
  if (isUserAPITokensEnabled) {
    const _header = req.headers[USER_API_TOKEN_HEADER];
    userApiTokenHeader = _header ? String(_header) : undefined;
  }

  if (process.env.IFRAME_SUPPORT_ENABLED === "true" && !header) {
    const name = "snaily-cad-iframe-cookie";
    header = req.cookies[name] || parse(String(req.headers.session))[name];
  }

  let user;
  let apiTokenUsed;
  if (userApiTokenHeader && isUserAPITokensEnabled) {
    const token = await prisma.apiToken.findFirst({
      where: { token: userApiTokenHeader },
    });

    if (!token) {
      throw new Forbidden(GetSessionUserErrors.InvalidAPIToken);
    }

    apiTokenUsed = token;
    user = await prisma.user.findFirst({
      where: { apiToken: { token: userApiTokenHeader } },
      select: userProperties,
    });

    if (user) {
      const hasPersonalApiTokenPerms = hasPermission({
        userToCheck: user,
        permissionsToCheck: [Permissions.UsePersonalApiToken],
      });

      if (!hasPersonalApiTokenPerms) {
        throw new Forbidden(GetSessionUserErrors.InvalidPermissionsForUserAPIToken);
      }
    }
  } else {
    if (!header && !returnNullOnError) {
      throw new Unauthorized(GetSessionUserErrors.Unauthorized);
    }

    const jwtPayload = verifyJWT(header);
    if (!jwtPayload) {
      if (returnNullOnError) return null;
      throw new Unauthorized(GetSessionUserErrors.Unauthorized);
    }

    user = await prisma.user.findUnique({
      where: { id: jwtPayload.userId },
      select: userProperties,
    });
  }

  if (!user) {
    if (returnNullOnError) return null;
    throw new Unauthorized(GetSessionUserErrors.NotFound);
  }

  if (user.banned) {
    if (returnNullOnError) return null;
    throw new NotFound(GetSessionUserErrors.UserBanned);
  }

  if (user.whitelistStatus === WhitelistStatus.PENDING) {
    if (returnNullOnError) return null;
    throw new NotFound(GetSessionUserErrors.WhitelistPending);
  }

  if (user.whitelistStatus === WhitelistStatus.DECLINED) {
    if (returnNullOnError) return null;
    throw new NotFound(GetSessionUserErrors.WhitelistDeclined);
  }

  if (apiTokenUsed) {
    await prisma.apiToken.update({
      where: { id: apiTokenUsed.id },
      data: {
        uses: (apiTokenUsed.uses ?? 0) + 1,
        logs: { create: { method: req.method, route: req.originalUrl } },
      },
    });
  }

  const { tempPassword, ...rest } = user ?? {};
  return { ...rest, tempPassword: null, hasTempPassword: !!tempPassword } as GetUserData;
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
