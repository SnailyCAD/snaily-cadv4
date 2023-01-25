import { combinedUnitProperties } from "lib/leo/activeOfficer";
import type {
  CombinedLeoUnit,
  CombinedEmsFdUnit,
  Officer,
  EmsFdDeputy,
  StatusValue,
} from "@prisma/client";
import { prisma } from "lib/data/prisma";

export async function findUnit(
  id: string,
  extraFind?: any,
): Promise<OfficerReturn | EmsFdReturn | CombinedLeoUnitReturn | CombinedEmsFdUnitReturn> {
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

    return { type: "combined-leo", unit: unit ?? null };
  }

  if (!unit) {
    unit = await prisma.combinedEmsFdUnit.findFirst({
      where: {
        id,
      },
      include: combinedUnitProperties,
    });

    return { type: "combined-ems-fd", unit: unit ?? null };
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

interface CombinedLeoUnitReturn {
  type: "combined-leo";
  unit: (CombinedLeoUnit & { status: StatusValue }) | null;
}

interface CombinedEmsFdUnitReturn {
  type: "combined-ems-fd";
  unit: (CombinedEmsFdUnit & { status: StatusValue }) | null;
}
