import { Rank, User } from ".prisma/client";
import { cad } from "@prisma/client";
import { API_TOKEN_HEADER, DISABLED_API_TOKEN_ROUTES, PERMISSION_ROUTES } from "@snailycad/config";
import { Context, Middleware, Req, MiddlewareMethods } from "@tsed/common";
import { BadRequest, Forbidden, Unauthorized } from "@tsed/exceptions";
import { getSessionUser } from "../lib/auth";
import { prisma } from "../lib/prisma";

const CAD_SELECT = (user?: Pick<User, "rank">) => ({
  id: true,
  name: true,
  areaOfPlay: true,
  maxPlateLength: true,
  towWhitelisted: true,
  whitelisted: true,
  disabledFeatures: true,
  liveMapSocketURl: user?.rank === Rank.OWNER,
  registrationCode: user?.rank === Rank.OWNER,
  steamApiKey: user?.rank === Rank.OWNER,
  apiTokenId: user?.rank === Rank.OWNER,
  apiToken: user?.rank === Rank.OWNER,
  discordWebhookURL: true,
  miscCadSettings: true,
  miscCadSettingsId: true,
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
    } else {
      user = await getSessionUser(req, true);
      ctx.set("user", user);

      const hasPermission = hasPermissionForReq(req, user);

      if (!hasPermission) {
        throw new Forbidden("Invalid Permissions");
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

    ctx.set("cad", setDiscordAUth(cad as any));
  }
}

export function setDiscordAUth<T extends Pick<cad, "disabledFeatures"> | null = cad>(cad: T) {
  const hasDiscordTokens = process.env["DISCORD_CLIENT_ID"] && process.env["DISCORD_CLIENT_SECRET"];
  const isEnabled = !cad?.disabledFeatures?.includes("DISCORD_AUTH");

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
  const requestMethod = req.method as any;

  const route = DISABLED_API_TOKEN_ROUTES.find(([r]) => r.startsWith(url) || url.startsWith(r));

  if (route) {
    const [, methods] = route;

    if (typeof methods === "string" && methods === "*") {
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
  const requestMethod = req.method as any;

  const [route] = PERMISSION_ROUTES.filter(([m, r]) => {
    if (typeof r === "string") {
      const isTrue = r.startsWith(url) || url.startsWith(r);

      if (m === "*") {
        return isTrue;
      }

      return m.includes(requestMethod.toUpperCase()) && isTrue;
    }

    const isTrue = r.test(url) || url.match(r);

    if (m === "*") {
      return isTrue;
    }

    return m.includes(requestMethod.toUpperCase()) && isTrue;
  });

  if (route) {
    const [, , callback] = route;
    const hasPermission = callback(user);

    return hasPermission;
  }

  return true;
}
