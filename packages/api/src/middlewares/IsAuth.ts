import process from "node:process";
import { Rank, User } from ".prisma/client";
import { cad, WhitelistStatus } from "@prisma/client";
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
import { getCADVersion } from "src/main";

const CAD_SELECT = (user?: Pick<User, "rank">) => ({
  id: true,
  name: true,
  areaOfPlay: true,
  maxPlateLength: true,
  towWhitelisted: true,
  taxiWhitelisted: true,
  whitelisted: true,
  businessWhitelisted: true,
  disabledFeatures: true,
  autoSetUserProperties: true,
  liveMapSocketURl: user?.rank === Rank.OWNER,
  registrationCode: user?.rank === Rank.OWNER,
  steamApiKey: user?.rank === Rank.OWNER,
  apiTokenId: user?.rank === Rank.OWNER,
  apiToken: user?.rank === Rank.OWNER,
  miscCadSettings: true,
  miscCadSettingsId: true,
  logoId: true,
  discordRolesId: true,
  discordRoles: user?.rank === Rank.OWNER ? { include: { roles: true, leoRoles: true } } : true,
});

@Middleware()
export class IsAuth implements MiddlewareMethods {
  async use(@Req() req: Req, @Context() ctx: Context) {
    const header = req.headers[API_TOKEN_HEADER];

    let user;
    if (header) {
      const cad = await prisma.cad.findFirst({
        select: {
          apiToken: true,
        },
      });

      if (!cad?.apiToken?.enabled) {
        throw new Unauthorized("Unauthorized");
      }

      if (cad.apiToken.token !== header) {
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

    if (!header && !user) {
      throw new Unauthorized("Unauthorized");
    }

    let cad = await prisma.cad.findFirst({
      select: CAD_SELECT(user),
    });

    if (cad && !cad.miscCadSettings) {
      const miscSettings = await prisma.miscCadSettings.create({
        data: {},
      });

      cad = await prisma.cad.update({
        where: {
          id: cad.id,
        },
        data: {
          miscCadSettings: {
            connect: {
              id: miscSettings.id,
            },
          },
        },
        select: CAD_SELECT(user),
      });
    }

    const THREE_MIN_TIMEOUT_MS = 60 * 1000 * 3;
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

export function setDiscordAUth<T extends Pick<cad, "disabledFeatures"> | null = cad>(cad: T) {
  const hasDiscordTokens = process.env["DISCORD_CLIENT_ID"] && process.env["DISCORD_CLIENT_SECRET"];
  const isEnabled = !cad?.disabledFeatures.includes("DISCORD_AUTH");

  if (!cad && !hasDiscordTokens) {
    return { disabledFeatures: ["DISCORD_AUTH"] };
  }

  if (isEnabled && !hasDiscordTokens) {
    return { ...cad, disabledFeatures: [...(cad?.disabledFeatures ?? []), "DISCORD_AUTH"] };
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

  const [route] = PERMISSION_ROUTES.filter(([m, r]) => {
    if (typeof r === "object" && "strict" in r) {
      const urlWithBackslash = url.at(-1) === "/" ? url : `${url}/`;

      const isTrue = r.route === urlWithBackslash || r.route === url;
      return isTrue;
    }

    if (typeof r === "string") {
      const isTrue = r.startsWith(url) || url.startsWith(r);

      if (m === "*") {
        return isTrue;
      }

      return m.includes(requestMethod) && isTrue;
    }

    const isTrue = r.test(url) || url.match(r);

    if (m === "*") {
      return isTrue;
    }

    return m.includes(requestMethod) && isTrue;
  });

  if (route) {
    const [, , callback] = route;
    const hasPermission = callback(user);

    return hasPermission;
  }

  return true;
}
