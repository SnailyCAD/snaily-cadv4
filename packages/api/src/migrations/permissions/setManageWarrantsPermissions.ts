import { ToAddDefaultPermissionsKey } from "@prisma/client";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { prisma } from "lib/prisma";

export async function setManageWarrantsPermissions() {
  const users = await prisma.user.findMany({
    where: {
      NOT: {
        toAddDefaultPermissions: { some: { key: "MANAGE_WARRANTS_PERMISSIONS" } },
      },
      permissions: { hasSome: defaultPermissions.defaultLeoPermissions },
    },
  });

  await prisma.$transaction(
    users.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          permissions: { push: Permissions.ManageWarrants },
          toAddDefaultPermissions: {
            create: {
              key: ToAddDefaultPermissionsKey.MANAGE_WARRANTS_PERMISSIONS,
              permissions: [Permissions.ManageWarrants],
            },
          },
        },
      }),
    ),
  );
}
