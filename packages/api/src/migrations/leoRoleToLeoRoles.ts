import { prisma } from "lib/prisma";

export async function leoRoleToLeoRoles() {
  const discordRoles = await prisma.discordRoles.findFirst({
    where: { leoRoleId: { not: null } },
  });

  if (!discordRoles || !discordRoles.leoRoleId) return;

  await prisma.discordRoles.update({
    where: {
      id: discordRoles.id,
    },
    data: {
      leoRoleId: null,
      leoRoles: {
        connect: {
          id: discordRoles.leoRoleId,
        },
      },
    },
  });
}
