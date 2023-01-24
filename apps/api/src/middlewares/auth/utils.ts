import type { cad, User } from "@prisma/client";
import { DISABLED_API_TOKEN_ROUTES, Method } from "@snailycad/config";
import type { GetUserData } from "@snailycad/types/api";
import type { Req } from "@tsed/common";
import { userProperties } from "lib/auth/getSessionUser";
import { updateMemberRolesLogin } from "lib/discord/auth";
import { prisma } from "lib/data/prisma";

interface Options {
  req: Req;
  user: GetUserData;
}

export function isRouteDisabled(options: Pick<Options, "req">) {
  const url = options.req.originalUrl.toLowerCase();
  const requestMethod = options.req.method as Method;

  const route = DISABLED_API_TOKEN_ROUTES.find(([r]) => url.endsWith(r));

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

const THREE_MIN_TIMEOUT_MS = 60 * 1000 * 3;
interface DiscordSyncOptions {
  user: Pick<User, "lastDiscordSyncTimestamp" | "discordId" | "id">;
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
