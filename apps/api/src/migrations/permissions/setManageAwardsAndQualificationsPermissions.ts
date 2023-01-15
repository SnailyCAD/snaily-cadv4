import { ToAddDefaultPermissionsKey } from "@prisma/client";
import { defaultPermissions, Permissions } from "@snailycad/permissions";
import { prisma } from "lib/data/prisma";

export async function setManageAwardsAndQualificationsPermissions() {
  const users = await prisma.user.findMany({
    where: {
      NOT: {
        toAddDefaultPermissions: { some: { key: "MANAGE_AWARDS_AND_QUALIFICATIONS" } },
      },
      permissions: { hasSome: defaultPermissions.defaultLeoPermissions },
    },
    select: { id: true },
  });

  await prisma.$transaction(
    users.map((user) =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          permissions: { push: Permissions.ManageAwardsAndQualifications },
          toAddDefaultPermissions: {
            create: {
              key: ToAddDefaultPermissionsKey.MANAGE_AWARDS_AND_QUALIFICATIONS,
              permissions: [Permissions.ManageAwardsAndQualifications],
            },
          },
        },
      }),
    ),
  );
}
