import process from "node:process";
import { Feature, CadFeature, cad, Prisma } from "@prisma/client";
import { API_TOKEN_HEADER } from "@snailycad/config";
import { prisma } from "lib/data/prisma";
import { getCADVersion } from "@snailycad/utils/version";
import { handleDiscordSync } from "./utils/utils";
import { hasPermission, Permissions } from "@snailycad/permissions";
import { setErrorMap } from "zod";
import { getErrorMap } from "../../utils/zod-error-map";
import { createFeaturesObject, overwriteFeatures } from "../is-enabled";
import { getUserFromSession, setGlobalUserFromCADAPIToken } from "./utils/get-user";
import { CadFeatureOptions, User } from "@snailycad/types";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { FastifyReply } from "fastify";

@Injectable()
export class AuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext) {
    const http = context.switchToHttp();
    // todo: custom FastifyRequest type
    const request = http.getRequest();
    const response = http.getResponse<FastifyReply>();

    const globalCADApiToken = request.headers[API_TOKEN_HEADER];

    let user;
    if (globalCADApiToken) {
      const fakeUser = await setGlobalUserFromCADAPIToken({
        res: response,
        req: request,
        apiTokenHeader: globalCADApiToken,
      });

      user = fakeUser;

      request["user"] = fakeUser;
    } else {
      user = await getUserFromSession({ res: response, req: request });

      request["user"] = user;
      request["sessionUserId"] = user.id;
    }

    if (!globalCADApiToken && !user) {
      return false;
    }

    const hasManageCadSettingsPermissions = hasPermission({
      permissionsToCheck: [Permissions.ManageCADSettings],
      userToCheck: user as User,
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

      request["cad"] = { ...setCADFeatures(cad), version: await getCADVersion() };
    }

    // localized error messages
    const localeHeader = request.headers.sn_locale as string | undefined;
    const errorMap = await getErrorMap((user as User).locale || localeHeader || "en");
    setErrorMap(errorMap);

    if (user) {
      await handleDiscordSync({ user: user as User, cad });
    }

    return true;
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
