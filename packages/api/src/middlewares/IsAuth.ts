import process from "node:process";
import { Rank, User, CadFeature, WhitelistStatus, Feature } from "@prisma/client";
import {
  API_TOKEN_HEADER,
  DISABLED_API_TOKEN_ROUTES,
  Method,
  PERMISSION_ROUTES,
} from "@snailycad/config";
import { Context, Middleware, Req, MiddlewareMethods } from "@tsed/common";
import { BadRequest, Forbidden, Unauthorized } from "@tsed/exceptions";
import { getSessionUser, userProperties } from "lib/auth/user";
import { prisma } from "lib/prisma";
import { updateMemberRolesLogin } from "lib/discord/auth";
import { getCADVersion } from "@snailycad/utils/version";
import { allPermissions } from "@snailycad/permissions";

const THREE_MIN_TIMEOUT_MS = 60 * 1000 * 3;
const CAD_SELECT = (user?: Pick<User, "rank">) => ({
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
  discordRoles:
    user?.rank === Rank.OWNER
      ? {
          include: {
            roles: true,
            leoRoles: true,
            emsFdRoles: true,
            dispatchRoles: true,
            leoSupervisorRoles: true,
            taxiRoles: true,
            towRoles: true,
          },
        }
      : true,
});

@Middleware()
export class IsAuth implements MiddlewareMethods {
  async use(@Req() req: Req, @Context() ctx: Context) {
    const apiTokenHeader = req.headers[API_TOKEN_HEADER];

    let user;
    if (apiTokenHeader) {
      const cad = await prisma.cad.findFirst({
        select: {
          apiToken: true,
        },
      });

      if (!cad?.apiToken?.enabled || cad.apiToken.token !== apiTokenHeader) {
        throw new Unauthorized("Unauthorized");
      }

      const isDisabled = isRouteDisabled(req);
      if (isDisabled) {
        throw new BadRequest("routeIsDisabled");
      }

      const fakeUser = {
        isDispatch: true,
        isLeo: true,
        isEmsFd: true,
        rank: "API_TOKEN",
        isTow: true,
        isTaxi: true,
        isSupervisor: true,
        username: "Dispatch",
        whitelistStatus: WhitelistStatus.ACCEPTED,
        permissions: allPermissions,
      };
      ctx.set("user", fakeUser);
    } else {
      user = await getSessionUser(req, true);
      ctx.set("user", user);

      const hasPermission = hasPermissionForReq(req, user);
      if (!hasPermission) {
        throw new Forbidden("Invalid Permissions");
      }

      const user2FA = await prisma.user2FA.findFirst({
        where: { userId: user.id },
      });

      if (user2FA) {
        (user as any).twoFactorEnabled = true;
      }
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

    const hasThreeMinTimeoutEnded =
      !user?.lastDiscordSyncTimestamp ||
      THREE_MIN_TIMEOUT_MS - (Date.now() - user.lastDiscordSyncTimestamp.getTime()) < 0;

    if (user?.discordId && hasThreeMinTimeoutEnded) {
      const updated = await prisma.user.update({
        where: { id: user.id },
        data: {
          lastDiscordSyncTimestamp: new Date(),
        },
        select: userProperties,
      });

      if (cad?.discordRolesId && updated.discordId) {
        await updateMemberRolesLogin(updated, cad?.discordRolesId);
      }
    }

    ctx.set("cad", { ...setDiscordAUth(cad), version: await getCADVersion() });
  }
}

export function setDiscordAUth(cad: { features?: CadFeature[] } | null) {
  const hasDiscordTokens = process.env["DISCORD_CLIENT_ID"] && process.env["DISCORD_CLIENT_SECRET"];
  const isEnabled = !cad?.features?.some((v) => v.isEnabled && v.feature === "DISCORD_AUTH");

  const notEnabled = { isEnabled: false, feature: "DISCORD_AUTH" } as CadFeature;
  const filtered = cad?.features?.filter((v) => v.feature !== Feature.DISCORD_AUTH) ?? [];

  if (!cad && !hasDiscordTokens) {
    return { features: [...filtered, notEnabled] };
  }

  if (isEnabled && !hasDiscordTokens) {
    return { ...cad, features: [...filtered, notEnabled] };
  }

  return cad;
}

function isRouteDisabled(req: Req) {
  const url = req.originalUrl.toLowerCase();
  const requestMethod = req.method as Method;

  const route = DISABLED_API_TOKEN_ROUTES.find(([r]) => r.startsWith(url) || url.startsWith(r));

  if (route) {
    const [, methods] = route;

    if (typeof methods === "string") {
      return true;
    } else if (Array.isArray(methods) && methods.includes(requestMethod)) {
      return true;
    }

    return false;
  }

  return false;
}

function hasPermissionForReq(req: Req, user: User) {
  const url = req.originalUrl.toLowerCase();
  const requestMethod = req.method.toUpperCase() as Method;

  const [route] = PERMISSION_ROUTES.filter(([m, route]) => {
    const urlWithBackslash = url.at(-1) === "/" ? url : `${url}/`;
    const isMethodTrue = m === "*" ? true : m.includes(requestMethod);

    const isTrue = (route.route === urlWithBackslash || route.route === url) && isMethodTrue;
    return isTrue;
  });

  if (route) {
    const [, , callback] = route;
    const hasPermission = callback(user);

    return hasPermission;
  }

  return true;
}
