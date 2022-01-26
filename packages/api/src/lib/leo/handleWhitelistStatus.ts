import { Officer, LeoWhitelistStatus } from "@prisma/client";
import { prisma } from "lib/prisma";
import { ExtendedNotFound } from "src/exceptions/ExtendedNotFound";

/**
 * this function handles the addition of the `whitelistStatus` to an officer
 *
 * 1. Provided department === whitelisted
 *  -> `whitelistStatus` gets created and linked to provided officer
 *
 * 2. Provided department !== whitelisted
 *  -> `whitelistStatus` gets removed from provided officer
 */
export async function handleWhitelistStatus(
  departmentId: string,
  officer: (Officer & { whitelistStatus: LeoWhitelistStatus | null }) | null,
) {
  const department = await prisma.departmentValue.findUnique({
    where: { id: departmentId },
  });

  if (!department) {
    throw new ExtendedNotFound({ department: "This department could not be found" });
  }

  let defaultDepartmentId: string | null = null;
  let whitelistStatusId: string | null = officer?.whitelistStatusId ?? null;
  if (department.whitelisted) {
    const whitelistStatus =
      officer?.whitelistStatus ??
      (await prisma.leoWhitelistStatus.create({
        data: { status: "PENDING", departmentId },
      }));

    const previousDepartmentId =
      whitelistStatus.status === "DECLINED" ? officer?.departmentId : whitelistStatus.departmentId;

    if (previousDepartmentId !== department.id && officer?.whitelistStatusId) {
      const updated = await prisma.leoWhitelistStatus.update({
        where: { id: officer.whitelistStatusId },
        data: { status: "PENDING", departmentId },
        select: { id: true },
      });

      whitelistStatusId = updated.id;
    }

    const defaultDepartment = await prisma.departmentValue.findFirst({
      where: { isDefaultDepartment: true },
    });

    whitelistStatusId = whitelistStatus.id;
    defaultDepartmentId = defaultDepartment?.id ?? null;
  } else {
    whitelistStatusId &&
      (await prisma.leoWhitelistStatus.delete({
        where: { id: whitelistStatusId },
      }));

    whitelistStatusId = null;
    defaultDepartmentId = null;
  }

  return { whitelistStatusId, defaultDepartmentId };
}
