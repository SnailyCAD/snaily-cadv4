import { MiscCadSettings, JailTimeScale } from "@prisma/client";
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

type InactivityReturn<Prop extends string> = {
  filter: Record<
    Prop,
    {
      gte: Date;
    }
  >;
} & Record<Prop, Date>;

export function getInactivityFilter<Prop extends string = "updatedAt">(
  cad: { miscCadSettings: MiscCadSettings | null },
  property?: Prop,
): InactivityReturn<Prop> | null {
  const inactivityTimeout = cad.miscCadSettings?.inactivityTimeout ?? null;
  const _prop = property ?? "updatedAt";

  if (!inactivityTimeout) {
    return null;
  }

  const milliseconds = inactivityTimeout * (1000 * 60);
  const updatedAt = new Date(new Date().getTime() - milliseconds);

  const filter = {
    [_prop]: { gte: updatedAt },
  };

  return { filter, [_prop]: updatedAt } as InactivityReturn<Prop>;
}

export function convertToJailTimeScale(total: number, scale: JailTimeScale) {
  if (scale === JailTimeScale.HOURS) {
    return total * 60 * 60 * 1000 * 24;
  }

  if (scale === JailTimeScale.MINUTES) {
    return total * 60 * 1000;
  }

  return total * 1000;
}
