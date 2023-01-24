import { combinedUnitProperties } from "lib/leo/activeOfficer";
import type { CombinedLeoUnit, Officer, EmsFdDeputy, StatusValue } from "@prisma/client";
import { prisma } from "lib/data/prisma";

export async function findUnit(
  id: string,
  extraFind?: any,
): Promise<OfficerReturn | EmsFdReturn | CombinedUnitReturn> {
  let type: "leo" | "ems-fd" = "leo";
  let unit: any = await prisma.officer.findFirst({
    where: { id, ...extraFind },
  });

  if (!unit) {
    type = "ems-fd";
    unit = await prisma.emsFdDeputy.findFirst({ where: { id, ...extraFind } });
  }

  if (!unit) {
    unit = await prisma.combinedLeoUnit.findFirst({
      where: {
        id,
      },
      include: combinedUnitProperties,
    });

    return { type: "combined", unit: unit ?? null };
  }

  return { type, unit: unit ?? null };
}

interface OfficerReturn {
  type: "leo";
  unit: Officer | null;
}

interface EmsFdReturn {
  type: "ems-fd";
  unit: EmsFdDeputy | null;
}

interface CombinedUnitReturn {
  type: "combined";
  unit: (CombinedLeoUnit & { status: StatusValue }) | null;
}
