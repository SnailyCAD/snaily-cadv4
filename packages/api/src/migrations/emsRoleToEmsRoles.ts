import { prisma } from "lib/prisma";

export async function emsRoleToEmsRoles() {
  const discordRoles = await prisma.discordRoles.findFirst({
    where: { emsFdRoleId: { not: null } },
  });

  if (!discordRoles || !discordRoles.emsFdRoleId) return;

  await prisma.discordRoles.update({
    where: {
      id: discordRoles.id,
    },
    data: {
      emsFdRoleId: null,
      emsFdRoles: {
        connect: {
          id: discordRoles.emsFdRoleId,
        },
      },
    },
  });
}
