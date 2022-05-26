import process from "node:process";
import { Rank, User, CadFeature, Feature } from "@prisma/client";
import { API_TOKEN_HEADER } from "@snailycad/config";
import { Context, Middleware, Req, MiddlewareMethods } from "@tsed/common";
import { Unauthorized } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { getCADVersion } from "@snailycad/utils/version";
import { handleDiscordSync } from "./auth/utils";
import { getUserFromCADAPIToken, getUserFromSession } from "./auth/getUser";

@Middleware()
export class IsAuth implements MiddlewareMethods {
  async use(@Req() req: Req, @Context() ctx: Context) {
    const apiTokenHeader = req.headers[API_TOKEN_HEADER];

    let user;
    if (apiTokenHeader) {
      const fakeUser = getUserFromCADAPIToken({ req, apiTokenHeader });
      ctx.set("user", fakeUser);
    } else {
      user = await getUserFromSession({ req });
      ctx.set("user", user);
    }

    if (!apiTokenHeader && !user) {
      throw new Unauthorized("Unauthorized");
    }

    let cad = await prisma.cad.findFirst({
      select: CAD_SELECT(user),
    });

    if (cad && !cad.miscCadSettings) {
      cad = await prisma.cad.update({
        where: { id: cad.id },
        data: {
          miscCadSettings: {
            create: {},
          },
        },
        select: CAD_SELECT(user),
      });
    }

    if (user) {
      await handleDiscordSync({ user, cad });
    }

    ctx.set("cad", { ...setDiscordAuth(cad), version: await getCADVersion() });
  }
}

export function setDiscordAuth(cad: { features?: CadFeature[] } | null) {
  const hasDiscordTokens =
    Boolean(process.env["DISCORD_CLIENT_ID"]) && Boolean(process.env["DISCORD_CLIENT_SECRET"]);

  const isEnabled = !cad?.features?.some((v) => v.isEnabled && v.feature === Feature.DISCORD_AUTH);

  const notEnabled = { isEnabled: false, feature: Feature.DISCORD_AUTH } as CadFeature;
  const filtered = cad?.features?.filter((v) => v.feature !== Feature.DISCORD_AUTH) ?? [];

  if (!cad && !hasDiscordTokens) {
    return { features: [...filtered, notEnabled] };
  }

  if (isEnabled && !hasDiscordTokens) {
    return { ...cad, features: [...filtered, notEnabled] };
  }

  return cad;
}

export function CAD_SELECT(user?: Pick<User, "rank"> | null) {
  return {
    id: true,
    name: true,
    areaOfPlay: true,
    maxPlateLength: true,
    towWhitelisted: true,
    taxiWhitelisted: true,
    whitelisted: true,
    businessWhitelisted: true,
    features: true,
    autoSetUserProperties: true,
    liveMapSocketURl: user?.rank === Rank.OWNER,
    registrationCode: user?.rank === Rank.OWNER,
    steamApiKey: user?.rank === Rank.OWNER,
    apiTokenId: user?.rank === Rank.OWNER,
    apiToken: user?.rank === Rank.OWNER,
    miscCadSettings: user?.rank === Rank.OWNER ? { include: { webhooks: true } } : true,
    miscCadSettingsId: true,
    logoId: true,
    discordRolesId: true,
  };
}
