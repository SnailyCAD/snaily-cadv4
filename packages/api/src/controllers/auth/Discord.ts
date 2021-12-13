import { Get, QueryParams, Req, Res } from "@tsed/common";
import { Controller } from "@tsed/di";
import { URL } from "node:url";
import fetch from "node-fetch";
import { RESTPostOAuth2AccessTokenResult, APIUser } from "discord-api-types";
import { encode } from "../../utils/discord";
import { prisma } from "../../lib/prisma";
import { getSessionUser } from "../../lib/auth";

const DISCORD_API_VERSION = "v9";
const discordApiUrl = `https://discord.com/api/${DISCORD_API_VERSION}`;
const callbackUrl = makeCallbackURL(findUrl());
const DISCORD_CLIENT_ID = process.env["DISCORD_CLIENT_ID"];
const DISCORD_CLIENT_SECRET = process.env["DISCORD_CLIENT_SECRET"];

@Controller("/auth/discord")
export class DiscordAuth {
  @Get("/")
  async handleRedirectToDiscordOAuthAPI(@Res() res: Res) {
    const url = new URL(`${discordApiUrl}/oauth2/authorize`);

    url.searchParams.append("client_id", DISCORD_CLIENT_ID!);
    url.searchParams.append("redirect_uri", callbackUrl);
    url.searchParams.append("prompt", "consent");
    url.searchParams.append("response_type", "code");
    url.searchParams.append("scope", encodeURIComponent("identify"));

    return res.redirect(url.toString());
  }

  @Get("/callback")
  async handleCallbackFromDiscord(@QueryParams() query: any, @Res() res: Res, @Req() req: Req) {
    const code = query.code;
    const data = await getDiscordData(code);
    const redirectURL = findRedirectURL();
    const authUser = await getSessionUser(req, false);

    if (!data) {
      return res.redirect(`${redirectURL}/account?tab=discord&error=could not fetch discord data`);
    }

    const user = await prisma.user.findFirst({
      where: { discordId: data.id },
    });

    if (!user && !authUser) {
      const existingUserWithUsername = await prisma.user.findUnique({
        where: { username: data.username },
      });

      if (existingUserWithUsername) {
        return res.redirect(
          // todo: add random characters behind username and remove this error
          `${redirectURL}/account?tab=discord&error=could not create a new account with Discord since the username is already in-use.`,
        );
      }

      await prisma.user.create({
        data: {
          username: data.username,
          password: "",
          discordId: data.id,
        },
      });
    } else {
      await prisma.user.update({
        where: {
          id: authUser.id,
        },
        data: {
          discordId: data.id,
        },
      });

      return res.redirect(`${redirectURL}/account?tab=discord&success`);
    }

    // todo, do something with the Discord data
    /**
     * 1. find user by discordId
     *
     * -> user found
     *    -> authenticate user
     *
     * -> user not found
     *    -> create account with Discord username
     *    -> set discordId
     *    -> authenticate user
     */

    return { data };
  }
}

async function getDiscordData(code: string): Promise<APIUser | null> {
  const data = (await fetch(
    `${discordApiUrl}/oauth2/token?grant_type=authorization_code&code=${code}&redirect_uri=${callbackUrl}`,
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
  ).then((v) => v.json())) as RESTPostOAuth2AccessTokenResult;

  const accessToken = data.access_token;

  const meData = await fetch(`${discordApiUrl}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((v) => v.json())
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
