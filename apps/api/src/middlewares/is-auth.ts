import process from "node:process";
import { Rank, User, Feature, CadFeature, cad } from "@prisma/client";
import { API_TOKEN_HEADER } from "@snailycad/config";
import { Context, Middleware, Req, MiddlewareMethods, Res } from "@tsed/common";
import { Unauthorized } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { getCADVersion } from "@snailycad/utils/version";
import { handleDiscordSync } from "./auth/utils";
import { setGlobalUserFromCADAPIToken, getUserFromSession } from "./auth/get-user";
import { hasPermission, Permissions } from "@snailycad/permissions";
import { setErrorMap } from "zod";
import { getErrorMap } from "../utils/zod-error-map";
import { createFeaturesObject, overwriteFeatures } from "./is-enabled";

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

      ctx.set("cad", { ...setCADFeatures(cad), version: await getCADVersion() });
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

/**
 * overwrite features that cannot be enabled if the required tokens are not set
 */
export function setCADFeatures<T extends Partial<cad & { features?: CadFeature[] }> | null>(
  cad: T,
): Omit<T, "features"> & { features: Record<Feature, boolean> } {
  const features = createFeaturesObject(cad?.features);

  const hasDiscordTokens =
    Boolean(process.env["DISCORD_CLIENT_ID"]) && Boolean(process.env["DISCORD_CLIENT_SECRET"]);
  const hasSteamTokens = Boolean(process.env["STEAM_API_KEY"]);

  const isSteamOAuthEnabled = features.STEAM_OAUTH;
  const isDiscordOauthEnabled = features.DISCORD_AUTH;

  const isForceDiscordAuthEnabled = features.FORCE_DISCORD_AUTH;
  const isForceSteamAuthEnabled = features.FORCE_STEAM_AUTH;

  const filtered = overwriteFeatures({
    features,
    featuresToOverwrite: {
      DISCORD_AUTH: hasDiscordTokens && isDiscordOauthEnabled,
      FORCE_DISCORD_AUTH: hasDiscordTokens && isForceDiscordAuthEnabled,
      STEAM_OAUTH: isSteamOAuthEnabled && hasSteamTokens,
      FORCE_STEAM_AUTH: isForceSteamAuthEnabled && hasSteamTokens,
    },
  });

  return { ...cad, features: filtered };
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
    autoSetUserPropertiesId: true,
    discordRoles: includeDiscordRoles
      ? {
          include: {
            roles: true,
            adminRoles: true,
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
