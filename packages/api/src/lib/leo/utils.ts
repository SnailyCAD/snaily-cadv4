import type { MiscCadSettings } from "@prisma/client";
import { prisma } from "lib/prisma";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";

interface MaxDepartmentOptions {
  type: "emsFdDeputy" | "officer";
  userId: string;
  cad: { miscCadSettings: MiscCadSettings };
  departmentId: string;
  unitId?: string;
}

export async function validateMaxDepartmentsEachPerUser({
  type,
  unitId,
  cad,
  userId,
  departmentId,
}: MaxDepartmentOptions) {
  if (!cad.miscCadSettings.maxDepartmentsEachPerUser) return;

  const extraWhere = unitId ? { NOT: { id: unitId } } : {};

  // @ts-expect-error methods are the same
  const departmentCount = await prisma[type].count({
    where: { userId, departmentId, ...extraWhere },
  });

  if (departmentCount >= cad.miscCadSettings.maxDepartmentsEachPerUser) {
    throw new ExtendedBadRequest({ department: "maxDepartmentsReachedPerUser" });
  }
}

export function getInactivityFilter<Obj = { updatedAt: Date }>(
  cad: { miscCadSettings: MiscCadSettings | null },
  property: keyof Obj,
) {
  const inactivityTimeout = cad.miscCadSettings?.inactivityTimeout ?? null;

  if (!inactivityTimeout) {
    return null;
  }

  const milliseconds = inactivityTimeout * (1000 * 60);
  const updatedAt = new Date(new Date().getTime() - milliseconds);

  const filter = {
    [property]: { gte: updatedAt },
  };

  return { filter, updatedAt };
}
