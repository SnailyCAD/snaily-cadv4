import process from "node:process";
import { Rank, User, CadFeature, Feature } from "@prisma/client";
import { API_TOKEN_HEADER } from "@snailycad/config";
import { Context, Middleware, Req, MiddlewareMethods, Res } from "@tsed/common";
import { Unauthorized } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { getCADVersion } from "@snailycad/utils/version";
import { handleDiscordSync } from "./auth/utils";
import { setGlobalUserFromCADAPIToken, getUserFromSession } from "./auth/get-user";
import type { cad } from "@snailycad/types";
import { hasPermission, Permissions } from "@snailycad/permissions";
import { setErrorMap } from "zod";
import { getErrorMap } from "./error-map/zod-error-map";

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
      ctx.set("sessionUserId", user.id);
    }

    if (!globalCADApiToken && !user) {
      throw new Unauthorized("Unauthorized");
    }

    const hasManageCadSettingsPermissions = hasPermission({
      permissionsToCheck: [Permissions.ManageCADSettings],
      userToCheck: user ?? null,
      fallback: (user) => user.rank === Rank.OWNER,
    });

    let cad = await prisma.cad.findFirst({
      select: CAD_SELECT(user, hasManageCadSettingsPermissions),
    });

    if (cad) {
      if (!cad.miscCadSettings) {
        cad = await prisma.cad.update({
          select: CAD_SELECT(user, hasManageCadSettingsPermissions),
          where: { id: cad.id },
          data: { miscCadSettings: { create: {} } },
        });
      }

      ctx.set("cad", { ...setDiscordAuth(cad as cad), version: await getCADVersion() });
    }

    // localized error messages
    const localeHeader = req.headers.sn_locale as string | undefined;
    const errorMap = await getErrorMap(user?.locale || localeHeader || "en");
    setErrorMap(errorMap);

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
