import { Cookie } from "@snailycad/config";
import type { User } from "@prisma/client";
import type { Res } from "@tsed/common";
import cuid from "cuid";
import { prisma } from "lib/data/prisma";
import { signJWT } from "utils/jwt";
import { setCookie } from "utils/set-cookie";
import { postLoginFlowHandler } from "./post-auth";

// expire after 1 hour
export const ACCESS_TOKEN_EXPIRES_MS = 60 * 60 * 1000;
export const ACCESS_TOKEN_EXPIRES_S = ACCESS_TOKEN_EXPIRES_MS / 1000;

// expire after 7 days
export const REFRESH_TOKEN_EXPIRES_MS = 60 * 60 * 1000 * 24 * 7;
export const REFRESH_TOKEN_EXPIRES_S = REFRESH_TOKEN_EXPIRES_MS / 1000;

interface SetUserPreferencesCookiesOptions {
  user: User;
  res: Res;
}

export async function setUserTokenCookies(options: SetUserPreferencesCookiesOptions) {
  const sessionId = cuid();
  /**
   * create a new user session. This session is connected to the `sessions` array in the user model.
   * to find the user connected to this session, we try to find the user via `sessions` array
   * in `getSessionUser.ts`
   */
  const session = await prisma.userSession.create({
    data: {
      id: sessionId,
      expires: new Date(Date.now() + REFRESH_TOKEN_EXPIRES_MS),
      userId: options.user.id,
      refreshToken: signJWT({ sessionId }, REFRESH_TOKEN_EXPIRES_S),
    },
  });

  const accessToken = signJWT({ userId: options.user.id }, ACCESS_TOKEN_EXPIRES_S);

  setCookie({
    res: options.res,
    name: Cookie.AccessToken,
    expires: ACCESS_TOKEN_EXPIRES_MS,
    value: accessToken,
  });
  setCookie({
    res: options.res,
    name: Cookie.RefreshToken,
    expires: REFRESH_TOKEN_EXPIRES_MS,
    value: session.refreshToken,
  });

  await postLoginFlowHandler({ userId: options.user.id });
}
