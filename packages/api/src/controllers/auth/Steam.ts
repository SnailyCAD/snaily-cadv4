import process from "node:process";
import { Context, Delete, Get, QueryParams, Req, Res, UseBefore } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { Controller } from "@tsed/di";
import { URL } from "node:url";
import { prisma } from "lib/prisma";
import type { User } from "@prisma/client";
import { IsAuth } from "middlewares/IsAuth";
import { Description } from "@tsed/schema";
import { request } from "undici";
import { findRedirectURL, findUrl } from "./Discord";

const callbackUrl = makeCallbackURL(findUrl());
const STEAM_API_KEY = process.env["STEAM_API_KEY"];
export const STEAM_API_URL = "https://api.steampowered.com";

@Controller("/auth/steam")
export class SteamOAuthController {
  @Get("/")
  @Description("Redirect to Steam's OAuth2 URL")
  async handleRedirectToSteamOAuthAPI(@Res() res: Res) {
    if (!STEAM_API_KEY) {
      throw new BadRequest(
        "No `STEAM_API_KEY` was specified in the .env file. Please refer to the documentation: https://cad-docs.caspertheghost.me/docs/steam-integration/steam-authentication",
      );
    }

    const url = `https://steamcommunity.com/openid/login?openid.mode=checkid_setup&openid.ns=http://specs.openid.net/auth/2.0&openid.ns.sreg=http://openid.net/extensions/sreg/1.1&openid.sreg.optional=nickname,email,fullname,dob,gender,postcode,country,language,timezone&openid.ns.ax=http://openid.net/srv/ax/1.0&openid.ax.mode=fetch_request&openid.ax.type.fullname=http://axschema.org/namePerson&openid.ax.type.firstname=http://axschema.org/namePerson/first&openid.ax.type.email=http://axschema.org/contact/email&openid.ax.required=fullname,email&openid.identity=http://specs.openid.net/auth/2.0/identifier_select&openid.claimed_id=http://specs.openid.net/auth/2.0/identifier_select&openid.return_to=${callbackUrl}&openid.realm=${callbackUrl}`;
    return res.redirect(301, url);
  }

  @Get("/callback")
  @Description("Handle Steam's OAuth2 response. Authenticate user where possible.")
  async handleCallbackFromSteam(@QueryParams() query: any, @Res() res: Res, @Req() req: Req) {
    req;
    const redirectURL = findRedirectURL();
    const identity = query["openid.identity"];

    const steamId = identity?.replace("https://steamcommunity.com/openid/id/", "");
    if (!steamId) {
      return res.redirect(`${redirectURL}/auth/login?error=invalidCode`);
    }

    const steamData = await getSteamData(steamId);
    console.log({ steamData });

    return steamData;
  }

  @Delete("/")
  @UseBefore(IsAuth)
  @Description("Remove Steam OAuth2 from the authenticated user")
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

async function getSteamData(steamId: string) {
  const data = await request(
    `${STEAM_API_URL}/ISteamUser/GetPlayerSummaries/v0002/?key=${STEAM_API_KEY}&steamids=${steamId}`,
    {
      method: "GET",
      headers: { accept: "application/json" },
    },
  ).then((v) => v.body.json());

  return data?.response?.players[0];
}

function makeCallbackURL(base: string) {
  return `${new URL(base)}/auth/steam/callback`;
}
