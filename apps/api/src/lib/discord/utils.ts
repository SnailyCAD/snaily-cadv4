import { prisma } from "lib/data/prisma";

export function encode(obj: Record<string, unknown>) {
  let string = "";

  for (const [key, value] of Object.entries(obj)) {
    if (!value) continue;
    string += `&${encodeURIComponent(key)}=${encodeURIComponent(`${value}`)}`;
  }

  return string.substring(1);
}

export async function isDiscordIdInUse(discordId: string, userId: string) {
  const existing = await prisma.user.findFirst({
    where: {
      discordId,
    },
  });

  return existing && userId !== existing.id;
}

export function parseDiscordGuildIds(guildId: string) {
  const guildIds = guildId.split(",");
  return guildIds;
}
