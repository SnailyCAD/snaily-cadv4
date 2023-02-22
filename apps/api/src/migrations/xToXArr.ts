import { prisma } from "lib/data/prisma";

const types = {
  leoRoleId: "leoRoles",
  emsFdRoleId: "emsFdRoles",
  dispatchRoleId: "dispatchRoles",
  towRoleId: "towRoles",
  taxiRoleId: "taxiRoles",
  leoSupervisorRoleId: "leoSupervisorRoles",
  adminRoleId: "adminRoles",
} as const;

type Type =
  | "leoRoleId"
  | "emsFdRoleId"
  | "dispatchRoleId"
  | "towRoleId"
  | "taxiRoleId"
  | "leoSupervisorRoleId"
  | "adminRoleId";

async function xToXArr(type: Type) {
  const discordRoles = await prisma.discordRoles.findFirst({
    where: { [type]: { not: null } },
  });

  if (!discordRoles?.[type]) return;

  await prisma.discordRoles.update({
    where: {
      id: discordRoles.id,
    },
    data: {
      [type]: null,
      [types[type]]: {
        connect: {
          id: discordRoles[type],
        },
      },
    },
  });
}

export async function xToXArrAll() {
  const typesArr = Object.keys(types) as Type[];

  await Promise.all(
    typesArr.map(async (key) => {
      await xToXArr(key);
    }),
  );
}
