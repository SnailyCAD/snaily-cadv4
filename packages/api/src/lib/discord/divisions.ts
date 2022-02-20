import { DepartmentType } from "@prisma/client";
import { prisma } from "lib/prisma";

export async function appendDivisionsToUserUnits(userId: string, memberRoles: string[]) {
  console.log({ memberRoles });

  await Promise.all(
    memberRoles.map(async (roleId) => {
      const division = await prisma.divisionValue.findFirst({
        where: {
          discordRoleId: roleId,
        },
        select: { department: { select: { type: true } } },
      });

      if (!division) return;

      if (division.department?.type === DepartmentType.LEO) {
        userId;
        // todo: update LEO
      } else {
        // todo: update EMS/FD
      }
    }),
  );
}
