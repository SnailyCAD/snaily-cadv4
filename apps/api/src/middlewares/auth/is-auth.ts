import process from "node:process";
import { type Feature, type CadFeature, type cad, Prisma } from "@prisma/client";
import { API_TOKEN_HEADER } from "@snailycad/config";
import { Context, Middleware, Req, type MiddlewareMethods, Res } from "@tsed/common";
import { Unauthorized } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { getCADVersion } from "@snailycad/utils/version";
import { handleDiscordSync } from "./utils/utils";
import { hasPermission, Permissions } from "@snailycad/permissions";
import { setErrorMap } from "zod";
import { getErrorMap } from "../../utils/zod-error-map";
import { createFeaturesObject, overwriteFeatures } from "../is-enabled";
import { getUserFromSession, setGlobalUserFromCADAPIToken } from "./utils/get-user";
import { type CadFeatureOptions } from "@snailycad/types";

@Middleware()
export class IsAuth implements MiddlewareMethods {
  private lastVersionCheck: number | null = null;
  private currentVersion: Awaited<ReturnType<typeof getCADVersion>> | null = null;
  private VERSION_CHECK_INTERVAL = 1000 * 60 * 60;

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
    });

    let cad = await prisma.cad.findFirst({
      select: CAD_SELECT({
        selectCADsettings: hasManageCadSettingsPermissions,
        includeDiscordRoles: hasManageCadSettingsPermissions,
      }),
    });

    if (cad) {
      if (!cad.miscCadSettings) {
        cad = await prisma.cad.update({
          select: CAD_SELECT({
            selectCADsettings: hasManageCadSettingsPermissions,
            includeDiscordRoles: hasManageCadSettingsPermissions,
          }),
          where: { id: cad.id },
          data: { miscCadSettings: { create: {} } },
        });
      }

      const now = Date.now();
      if (!this.lastVersionCheck || now - this.lastVersionCheck > this.VERSION_CHECK_INTERVAL) {
        this.lastVersionCheck = now;
        this.currentVersion = await getCADVersion();
      }

      ctx.set("cad", { ...setCADFeatures(cad), version: this.currentVersion });
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
): Omit<T, "features"> & { features: Record<Feature, boolean> & { options?: CadFeatureOptions } } {
  const features = createFeaturesObject(cad?.features);

  const hasDiscordTokens =
    Boolean(process.env["DISCORD_CLIENT_ID"]) && Boolean(process.env["DISCORD_CLIENT_SECRET"]);
  const hasSteamTokens = Boolean(process.env["STEAM_API_KEY"]);

  const isSteamOAuthEnabled = features.STEAM_OAUTH;
  const isDiscordOauthEnabled = features.DISCORD_AUTH;

  const isForceDiscordAuthEnabled = features.FORCE_DISCORD_AUTH;
  const isForceSteamAuthEnabled = features.FORCE_STEAM_AUTH;

  let allowRegularLogin = features.ALLOW_REGULAR_LOGIN;
  if (!allowRegularLogin && !isDiscordOauthEnabled && !isSteamOAuthEnabled) {
    allowRegularLogin = true;
  }

  const filtered = overwriteFeatures({
    features,
    featuresToOverwrite: {
      DISCORD_AUTH: hasDiscordTokens && isDiscordOauthEnabled,
      FORCE_DISCORD_AUTH: hasDiscordTokens && isForceDiscordAuthEnabled,
      STEAM_OAUTH: isSteamOAuthEnabled && hasSteamTokens,
      FORCE_STEAM_AUTH: isForceSteamAuthEnabled && hasSteamTokens,
      ALLOW_REGULAR_LOGIN: allowRegularLogin,
    },
  });

  return { ...cad, features: filtered };
}

interface CadSelectOptions {
  includeDiscordRoles?: boolean;
  selectCADsettings?: boolean;
}

export function CAD_SELECT(options: CadSelectOptions) {
  return Prisma.validator<Prisma.cadSelect>()({
    id: true,
    name: true,
    areaOfPlay: true,
    towWhitelisted: true,
    taxiWhitelisted: true,
    whitelisted: true,
    businessWhitelisted: true,
    features: true,
    autoSetUserProperties: true,
    timeZone: true,
    registrationCode: options.selectCADsettings,
    steamApiKey: options.selectCADsettings,
    apiTokenId: options.selectCADsettings,
    apiToken: options.selectCADsettings,
    miscCadSettings: options.selectCADsettings
      ? { include: { webhooks: true, liveMapURLs: true } }
      : { include: { liveMapURLs: true } },
    miscCadSettingsId: true,
    logoId: true,
    discordRolesId: true,
    autoSetUserPropertiesId: true,
    discordRoles: options.includeDiscordRoles
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
  });
}
