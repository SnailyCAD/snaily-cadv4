import process from "node:process";
import { Context, Delete, Get, QueryParams, Req, Res, UseBefore } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { Controller } from "@tsed/di";
import { URL } from "node:url";
import { request } from "undici";
import type { RESTPostOAuth2AccessTokenResult, APIUser } from "discord-api-types";
import { encode } from "utils/discord";
import { prisma } from "lib/prisma";
import { getSessionUser } from "lib/auth";
import { WhitelistStatus, type User } from "@prisma/client";
import { AUTH_TOKEN_EXPIRES_MS, AUTH_TOKEN_EXPIRES_S } from "./Auth";
import { signJWT } from "utils/jwt";
import { setCookie } from "utils/setCookie";
import { Cookie } from "@snailycad/config";
import { IsAuth } from "middlewares/index";
import { DISCORD_API_URL } from "lib/discord";
import { updateMemberRolesLogin } from "lib/discord/auth";

const callbackUrl = makeCallbackURL(findUrl());
const DISCORD_CLIENT_ID = process.env["DISCORD_CLIENT_ID"];
const DISCORD_CLIENT_SECRET = process.env["DISCORD_CLIENT_SECRET"];

@Controller("/auth/discord")
export class DiscordAuth {
  @Get("/")
  async handleRedirectToDiscordOAuthAPI(@Res() res: Res) {
    const url = new URL(`${DISCORD_API_URL}/oauth2/authorize`);

    if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
      throw new BadRequest(
        "No `DISCORD_CLIENT_ID` was specified in the .env file. Please refer to the documentation: https://cad-docs.netlify.app/other/discord-authentication",
      );
    }

    url.searchParams.append("client_id", DISCORD_CLIENT_ID);
    url.searchParams.append("redirect_uri", callbackUrl);
    url.searchParams.append("prompt", "consent");
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", encodeURIComponent("identify"));

    return res.redirect(url.toString(), 301);
  }

  @Get("/callback")
  async handleCallbackFromDiscord(
    @QueryParams("code") code: string,
    @Res() res: Res,
    @Req() req: Req,
  ) {
    const redirectURL = findRedirectURL();

    if (!code) {
      return res.redirect(`${redirectURL}/auth/login?error=invalidCode`);
    }

    const data = await getDiscordData(code);
    const authUser: User | null = await getSessionUser(req, false);

    if (!data) {
      return res.redirect(`${redirectURL}/auth/login?error=could not fetch discord data`);
    }

    const users = await prisma.user.count();
    if (users <= 0) {
      return res.redirect(`${redirectURL}/auth/login?error=cannotRegisterFirstWithDiscord`);
    }

    const user = await prisma.user.findFirst({
      where: { discordId: data.id },
    });

    const cad = await prisma.cad.findFirst();
    const discordRolesId = cad?.discordRolesId ?? null;

    /**
     * a user was found with the discordId, but the user is not authenticated.
     *
     * -> log the user in and set the cookie
     */
    if (!authUser && user) {
      validateUser(user);
      await updateMemberRolesLogin(user, discordRolesId);

      // authenticate user with cookie
      const jwtToken = signJWT({ userId: user.id }, AUTH_TOKEN_EXPIRES_S);
      setCookie({
        res,
        name: Cookie.Session,
        expires: AUTH_TOKEN_EXPIRES_MS,
        value: jwtToken,
      });

      return res.redirect(`${redirectURL}/citizen`);
    }

    /**
     * there is no user authenticated and there is no user with the discordId already registered
     *
     * -> register the account and set cookie
     */
    if (!user && !authUser) {
      const existingUserWithUsername = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUserWithUsername) {
        return res.redirect(`${redirectURL}/auth/login?error=discordNameInUse`);
      }

      const user = await prisma.user.create({
        data: {
          username: data.username,
          password: "",
          discordId: data.id,
        },
      });

      const jwtToken = signJWT({ userId: user.id }, AUTH_TOKEN_EXPIRES_S);
      setCookie({
        res,
        name: Cookie.Session,
        expires: AUTH_TOKEN_EXPIRES_MS,
        value: jwtToken,
      });

      await updateMemberRolesLogin(user, discordRolesId);
      return res.redirect(`${redirectURL}/citizen`);
    }

    if (authUser && user) {
      if (user.id === authUser.id) {
        const updated = await prisma.user.update({
          where: {
            id: authUser.id,
          },
          data: {
            discordId: data.id,
          },
        });

        validateUser(user);
        await updateMemberRolesLogin(updated, discordRolesId);

        return res.redirect(`${redirectURL}/account?tab=discord&success`);
      }

      return res.redirect(`${redirectURL}/account?tab=discord&error=discordAccountAlreadyLinked`);
    }

    if (authUser && !user) {
      const updated = await prisma.user.update({
        where: {
          id: authUser.id,
        },
        data: {
          discordId: data.id,
        },
      });

      validateUser(authUser);
      await updateMemberRolesLogin(updated, discordRolesId);

      return res.redirect(`${redirectURL}/account?tab=discord&success`);
    }

    function validateUser(user: User) {
      if (user.banned) {
        return res.redirect(`${redirectURL}/auth/login?error=userBanned`);
      }

      if (user.whitelistStatus === WhitelistStatus.PENDING) {
        return res.redirect(`${redirectURL}/auth/login?error=whitelistPending`);
      }

      if (user.whitelistStatus === WhitelistStatus.DECLINED) {
        return res.redirect(`${redirectURL}/auth/login?error=whitelistDeclined`);
      }
    }
  }

  @Delete("/")
  @UseBefore(IsAuth)
  async removeDiscordAuth(@Context("user") user: User) {
    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        discordId: null,
      },
    });

    return true;
  }
}

async function getDiscordData(code: string): Promise<APIUser | null> {
  const data = (await request(
    `${DISCORD_API_URL}/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${callbackUrl}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: encode({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl,
        scope: "identify guilds",
      }),
    },
  ).then((v) => v.body.json())) as RESTPostOAuth2AccessTokenResult;

  const accessToken = data.access_token;
  const meData = await request(`${DISCORD_API_URL}/users/@me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((v) => v.body.json())
    .catch(() => null);

  return meData;
}

function findUrl() {
  const envUrl = process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080/v1";
  const includesDockerContainerName = envUrl === "http://api:8080/v1";

  if (includesDockerContainerName) {
    return "http://localhost:8080/v1";
  }

  return envUrl;
}

function findRedirectURL() {
  return process.env.CORS_ORIGIN_URL ?? "http://localhost:3000";
}

function makeCallbackURL(base: string) {
  return `${new URL(base)}/auth/discord/callback`;
}
