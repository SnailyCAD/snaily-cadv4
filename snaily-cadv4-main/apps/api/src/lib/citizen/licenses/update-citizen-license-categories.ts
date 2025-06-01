import type { LICENSE_SCHEMA } from "@snailycad/schemas";
import type { z } from "zod";
import type { DriversLicenseCategoryValue, Citizen, Prisma } from "@prisma/client";
import { getLastOfArray, manyToManyHelper } from "~/lib/data/many-to-many";
import { prisma } from "~/lib/data/prisma";
import type { SuspendedCitizenLicenses } from "@snailycad/types";

type LicenseSchema = Pick<
  z.infer<typeof LICENSE_SCHEMA>,
  | "driversLicenseCategory"
  | "pilotLicenseCategory"
  | "waterLicenseCategory"
  | "firearmLicenseCategory"
  | "huntingLicenseCategory"
  | "fishingLicenseCategory"
  | "otherLicenseCategory"
>;

export async function updateCitizenLicenseCategories(
  citizen: Citizen & {
    dlCategory?: DriversLicenseCategoryValue[];
    suspendedLicenses: SuspendedCitizenLicenses | null;
  },
  data: Partial<LicenseSchema>,
  include?: Prisma.CitizenInclude,
) {
  const suspendedLicenses = citizen.suspendedLicenses;

  const newArr = [
    ...returnNonSuspendedCategory(
      data.driversLicenseCategory ?? [],
      suspendedLicenses?.driverLicense,
    ),
    ...returnNonSuspendedCategory(data.pilotLicenseCategory ?? [], suspendedLicenses?.pilotLicense),
    ...returnNonSuspendedCategory(data.waterLicenseCategory ?? [], suspendedLicenses?.waterLicense),
    ...returnNonSuspendedCategory(
      data.firearmLicenseCategory ?? [],
      suspendedLicenses?.firearmsLicense,
    ),
    ...returnNonSuspendedCategory(
      data.huntingLicenseCategory ?? [],
      suspendedLicenses?.huntingLicense,
    ),
    ...returnNonSuspendedCategory(
      data.fishingLicenseCategory ?? [],
      suspendedLicenses?.fishingLicense,
    ),
    ...returnNonSuspendedCategory(data.otherLicenseCategory ?? [], false),
  ];
  const disconnectConnectArr = manyToManyHelper(
    citizen.dlCategory?.map((v) => v.id) ?? [],
    newArr,
    { showUpsert: false },
  );

  const last = getLastOfArray(
    await prisma.$transaction(
      disconnectConnectArr.map((v, idx) =>
        prisma.citizen.update({
          where: { id: citizen.id },
          data: { dlCategory: v },
          include: idx + 1 === disconnectConnectArr.length ? include : undefined,
        }),
      ),
    ),
  );

  return last;
}

function returnNonSuspendedCategory(categoryIds: string[], suspendedLicense = false) {
  if (suspendedLicense) {
    return [];
  }

  return categoryIds;
}
