import { combinedEmsFdUnitProperties, combinedUnitProperties } from "lib/leo/activeOfficer";
import type {
  CombinedLeoUnit,
  CombinedEmsFdUnit,
  Officer,
  EmsFdDeputy,
  StatusValue,
} from "@prisma/client";
import { prisma } from "lib/data/prisma";

interface Includes {
  officer?: any;
  emsFdDeputy?: any;
}

export async function findUnit(
  id: string,
  extraFind?: any,
  includes?: Includes,
): Promise<OfficerReturn | EmsFdReturn | CombinedLeoUnitReturn | CombinedEmsFdUnitReturn> {
  let type: "leo" | "ems-fd" | "combined-leo" | "combined-ems-fd" = "leo";
  let unit: any = await prisma.officer.findFirst({
    where: { id, ...extraFind },
    include: includes?.officer,
  });

  if (!unit) {
    type = "ems-fd";
    unit = await prisma.emsFdDeputy.findFirst({
      where: { id, ...extraFind },
      include: includes?.emsFdDeputy,
    });
  }

  if (!unit) {
    type = "combined-leo";
    unit = await prisma.combinedLeoUnit.findFirst({
      where: { id },
      include: combinedUnitProperties,
    });
  }

  if (!unit) {
    type = "combined-ems-fd";
    unit = await prisma.combinedEmsFdUnit.findFirst({
      where: { id },
      include: combinedEmsFdUnitProperties,
    });
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
