import { prisma } from "lib/prisma";

export function encode(obj: { [key: string]: unknown }) {
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
