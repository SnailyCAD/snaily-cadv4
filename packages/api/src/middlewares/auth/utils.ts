import type { cad, User } from "@prisma/client";
import { DISABLED_API_TOKEN_ROUTES, Method, PERMISSION_ROUTES } from "@snailycad/config";
import type { Req } from "@tsed/common";
import { userProperties } from "lib/auth/getSessionUser";
import { updateMemberRolesLogin } from "lib/discord/auth";
import { prisma } from "lib/prisma";

interface Options {
  req: Req;
  user: User;
}

export function isRouteDisabled(options: Pick<Options, "req">) {
  const url = options.req.originalUrl.toLowerCase();
  const requestMethod = options.req.method as Method;

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

export function hasPermissionForReq(options: Options) {
  const url = options.req.originalUrl.toLowerCase();
  const requestMethod = options.req.method.toUpperCase() as Method;

  const [route] = PERMISSION_ROUTES.filter(([m, route]) => {
    const urlWithBackslash = url.at(-1) === "/" ? url : `${url}/`;
    const isMethodTrue = m === "*" ? true : m.includes(requestMethod);

    const isTrue = (route.route === urlWithBackslash || route.route === url) && isMethodTrue;
    return isTrue;
  });

  if (route) {
    const [, , callback] = route;
    const hasPermission = callback(options.user);

    return hasPermission;
  }

  return true;
}

const THREE_MIN_TIMEOUT_MS = 60 * 1000 * 3;
interface DiscordSyncOptions {
  user: User;
  cad: Pick<cad, "discordRolesId"> | null;
}

export async function handleDiscordSync(options: DiscordSyncOptions) {
  if (!options.cad?.discordRolesId || !options.user.discordId) return;

  const hasThreeMinTimeoutEnded =
    !options.user.lastDiscordSyncTimestamp ||
    THREE_MIN_TIMEOUT_MS - (Date.now() - options.user.lastDiscordSyncTimestamp.getTime()) < 0;

  if (hasThreeMinTimeoutEnded) {
    const updated = await prisma.user.update({
      where: { id: options.user.id },
      data: { lastDiscordSyncTimestamp: new Date() },
      select: userProperties,
    });

    await updateMemberRolesLogin(updated, options.cad.discordRolesId);
  }
}
