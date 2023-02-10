import type { Req, Res } from "@tsed/common";
import { Unauthorized } from "@tsed/exceptions";
import { parse } from "cookie";
import { Cookie, USER_API_TOKEN_HEADER } from "@snailycad/config";
import { signJWT, verifyJWT } from "utils/jwt";
import { prisma } from "lib/data/prisma";
import { Feature, type User } from "@snailycad/types";
import { isFeatureEnabled } from "lib/cad";
import type { GetUserData } from "@snailycad/types/api";
import { setCookie } from "utils/set-cookie";
import { ACCESS_TOKEN_EXPIRES_MS, ACCESS_TOKEN_EXPIRES_S } from "./setUserTokenCookies";
import { getUserFromUserAPIToken } from "./getUserFromUserAPIToken";
import { validateUserData } from "./validateUser";
import { createFeaturesObject } from "middlewares/is-enabled";

export enum GetSessionUserErrors {
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
  createdAt: true,
  updatedAt: true,
  lastSeen: true,
};

interface GetSessionUserOptions<ReturnNullOnError extends boolean> {
  returnNullOnError?: ReturnNullOnError;
  req: Req;
  res: Res;
}

export async function getSessionUser(options: GetSessionUserOptions<false>): Promise<GetUserData>;
export async function getSessionUser(
  options: GetSessionUserOptions<true>,
): Promise<GetUserData | null>;
export async function getSessionUser(
  options: GetSessionUserOptions<boolean>,
): Promise<GetUserData | null> {
  const accessToken: string | undefined =
    options.req.cookies[Cookie.AccessToken] ||
    parse(String(options.req.headers.session))[Cookie.AccessToken] ||
    parse(String(options.req.headers.cookie))[Cookie.AccessToken];

  const refreshToken: string | undefined =
    options.req.cookies[Cookie.RefreshToken] ||
    parse(String(options.req.headers.session))[Cookie.RefreshToken] ||
    parse(String(options.req.headers.cookie))[Cookie.RefreshToken];

  const userApiTokenHeader = options.req.headers[USER_API_TOKEN_HEADER]
    ? String(options.req.headers[USER_API_TOKEN_HEADER])
    : undefined;

  const cad = await prisma.cad.findFirst({ select: { features: true } });
  const isUserAPITokensEnabled = isFeatureEnabled({
    feature: Feature.USER_API_TOKENS,
    features: createFeaturesObject(cad?.features),
    defaultReturn: false,
  });

  /**
   * `userApiTokenHeader` is defined (passed via headers) and `isUserAPITokensEnabled` is true (feature is enabled)
   * -> then we will try to get the user from the user's API token
   *
   * -> if the user exists, we validate them if they're not banned, awaiting whitelisting, etc.
   * -> if the validation fails, we throw an error respectively.
   * -> if the validations succeeds, we return the user.
   *
   * -> if `userApiTokenHeader` or `isUserAPITokensEnabled` is false, we will try to get the user from the access token (cookies)
   */
  if (userApiTokenHeader && isUserAPITokensEnabled) {
    const { apiToken, user } = await getUserFromUserAPIToken(userApiTokenHeader);
    validateUserData(user, options.req, options.returnNullOnError as false | undefined);

    await prisma.apiToken.update({
      where: { id: apiToken.id },
      data: {
        uses: { increment: 1 },
        logs: { create: { method: options.req.method, route: options.req.originalUrl } },
      },
    });

    return createUserData(user);
  }

  if (!accessToken && !refreshToken) {
    if (options.returnNullOnError) return null;
    throw new Unauthorized(GetSessionUserErrors.Unauthorized);
  }

  const accessTokenPayload = accessToken && verifyJWT(accessToken);

  /**
   * if there's a valid access token. We return the user saved in the database.
   */
  if (accessTokenPayload) {
    const user = await prisma.user.findUnique({
      where: { id: accessTokenPayload.userId },
      select: userProperties,
    });

    validateUserData(user, options.req, options.returnNullOnError as false | undefined);

    return createUserData(user);
  }

  if (!refreshToken) {
    if (options.returnNullOnError) return null;
    throw new Unauthorized(GetSessionUserErrors.Unauthorized);
  }

  const refreshTokenPayload = verifyJWT(refreshToken);
  if (refreshTokenPayload) {
    const user = await prisma.user.findFirst({
      select: userProperties,
      where: {
        sessions: {
          some: {
            refreshToken,
            id: refreshTokenPayload.sessionId,
            expires: { gte: new Date() },
          },
        },
      },
    });

    if (options.returnNullOnError && !user) {
      return null;
    }

    validateUserData(user, options.req, options.returnNullOnError as false | undefined);

    const newAccessToken = signJWT({ userId: user.id }, ACCESS_TOKEN_EXPIRES_S);

    setCookie({
      res: options.res,
      name: Cookie.AccessToken,
      expires: ACCESS_TOKEN_EXPIRES_MS,
      value: newAccessToken,
    });

    return createUserData(user);
  }

  if (options.returnNullOnError) {
    return null;
  }
  throw new Unauthorized(GetSessionUserErrors.Unauthorized);
}

function createUserData(user: User) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (!user) return user as GetUserData;

  const { tempPassword, ...rest } = user;
  return { ...rest, tempPassword: null, hasTempPassword: !!tempPassword } as GetUserData;
}

export function canManageInvariant<T extends Error>(
  userId: string | null | undefined,
  authUser: Pick<User, "rank" | "id">,
  error: T,
): asserts userId {
  if (!userId && (authUser.rank as string) !== "API_TOKEN") {
    throw error;
  }

  if ((authUser.rank as string) !== "API_TOKEN" && userId && userId !== authUser.id) {
    throw error;
  }
}
