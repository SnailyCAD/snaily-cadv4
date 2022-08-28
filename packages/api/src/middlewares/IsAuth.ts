import process from "node:process";
import { Rank, User, CadFeature, Feature } from "@prisma/client";
import { API_TOKEN_HEADER } from "@snailycad/config";
import { Context, Middleware, Req, MiddlewareMethods, Res } from "@tsed/common";
import { Unauthorized } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { getCADVersion } from "@snailycad/utils/version";
import { handleDiscordSync } from "./auth/utils";
import { setGlobalUserFromCADAPIToken, getUserFromSession } from "./auth/getUser";
import type { cad } from "@snailycad/types";

@Middleware()
export class IsAuth implements MiddlewareMethods {
  async use(@Req() req: Req, @Res() res: Res, @Context() ctx: Context) {
    const globalCADApiToken = req.headers[API_TOKEN_HEADER];

    let user;
    if (globalCADApiToken) {
      const fakeUser = await setGlobalUserFromCADAPIToken({
        res,
        req,
        apiTokenHeader: globalCADApiToken,
      });
      ctx.set("user", fakeUser);
    } else {
      user = await getUserFromSession({ res, req });
      ctx.set("user", user);
    }

    if (!globalCADApiToken && !user) {
      throw new Unauthorized("Unauthorized");
    }

    const cad = await prisma.cad.findFirst({ select: CAD_SELECT(user) });
    if (cad) {
      ctx.set("cad", { ...setDiscordAuth(cad as cad), version: await getCADVersion() });
    }

    if (user) {
      await handleDiscordSync({ user, cad });
    }
  }
}

export function setDiscordAuth<T extends Partial<cad>>(cad: T | null) {
  const features = cad?.features as CadFeature[] | undefined;
  const hasDiscordTokens =
    Boolean(process.env["DISCORD_CLIENT_ID"]) && Boolean(process.env["DISCORD_CLIENT_SECRET"]);

  const isEnabled = !features?.some((v) => v.isEnabled && v.feature === Feature.DISCORD_AUTH);

  const notEnabled = { isEnabled: false, feature: Feature.DISCORD_AUTH } as CadFeature;
  const filtered = features?.filter((v) => v.feature !== Feature.DISCORD_AUTH) ?? [];

  if (isEnabled && !hasDiscordTokens) {
    return { ...(cad as cad), features: [...filtered, notEnabled] };
  }

  return cad;
}

export function CAD_SELECT(user?: Pick<User, "rank"> | null, includeDiscordRoles?: boolean) {
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
    registrationCode: user?.rank === Rank.OWNER,
    steamApiKey: user?.rank === Rank.OWNER,
    apiTokenId: user?.rank === Rank.OWNER,
    apiToken: user?.rank === Rank.OWNER,
    miscCadSettings: user?.rank === Rank.OWNER ? { include: { webhooks: true } } : true,
    miscCadSettingsId: true,
    logoId: true,
    discordRolesId: true,
    discordRoles: includeDiscordRoles
      ? {
          include: {
            roles: true,
            leoRoles: true,
            emsFdRoles: true,
            leoSupervisorRoles: true,
            towRoles: true,
            taxiRoles: true,
            dispatchRoles: true,
            courthouseRoles: true,
          },
        }
      : undefined,
  };
}
