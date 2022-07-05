import type { LICENSE_SCHEMA } from "@snailycad/schemas";
import type { z } from "zod";
import type { DriversLicenseCategoryValue, Citizen, Prisma } from "@prisma/client";
import { getLastOfArray, manyToManyHelper } from "utils/manyToMany";
import { prisma } from "lib/prisma";

type LicenseSchema = Pick<
  z.infer<typeof LICENSE_SCHEMA>,
  | "driversLicenseCategory"
  | "pilotLicenseCategory"
  | "waterLicenseCategory"
  | "firearmLicenseCategory"
>;

export async function updateCitizenLicenseCategories(
  citizen: Citizen & { dlCategory?: DriversLicenseCategoryValue[] },
  data: Partial<LicenseSchema>,
  include?: Prisma.CitizenInclude,
) {
  const newArr = [
    ...(data.driversLicenseCategory ?? []),
    ...(data.pilotLicenseCategory ?? []),
    ...(data.waterLicenseCategory ?? []),
    ...(data.firearmLicenseCategory ?? []),
  ];
  const disconnectConnectArr = manyToManyHelper(citizen.dlCategory?.map((v) => v.id) ?? [], newArr);

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
