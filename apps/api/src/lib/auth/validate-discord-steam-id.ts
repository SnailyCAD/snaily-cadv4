import type { REGISTER_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/data/prisma";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import type { z } from "zod";

export async function validateDiscordAndSteamId(data: z.infer<typeof REGISTER_SCHEMA>) {
  const hasDiscordOrSteamId = Boolean(data.discordId) || Boolean(data.steamId);

  if (!data.password) {
    if (!hasDiscordOrSteamId) {
      throw new ExtendedBadRequest({
        password: "Required",
        error: "Must specify `discordId` or `steamId` when no password is present.",
      });
    }

    const _OR = [];
    if (data.discordId) {
      _OR.push({ discordId: data.discordId });
    }

    if (data.steamId) {
      _OR.push({ steamId: data.steamId });
    }

    const user = await prisma.user.findFirst({
      where: { OR: _OR },
    });

    if (user) {
      throw new ExtendedBadRequest({ username: "userAlreadyExistsWithDiscordOrSteamId" });
    }
  }
}
