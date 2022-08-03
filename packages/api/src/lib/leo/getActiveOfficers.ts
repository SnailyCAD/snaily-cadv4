import { cad, ShouldDoType } from "@snailycad/types";
import { prisma } from "lib/prisma";
import { combinedUnitProperties, leoProperties } from "./activeOfficer";
import { filterInactiveUnits, setInactiveUnitsOffDuty } from "./setInactiveUnitsOffDuty";
import { createInactivityFilter } from "./utils";

interface GetActiveOfficerOptions {
  cad: cad;
  skip?: number;
  includeAll?: boolean;
  query?: string;
}

export async function getActiveOfficers(options: GetActiveOfficerOptions) {
  const unitsInactivityFilter = createInactivityFilter(options.cad, "lastStatusChangeTimestamp");

  if (unitsInactivityFilter) {
    setInactiveUnitsOffDuty(unitsInactivityFilter.lastStatusChangeTimestamp);
  }

  const [officerCount, combinedUnitCount, officers, units] = await Promise.all([
    prisma.officer.count({
      where: { status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } } },
    }),
    prisma.combinedLeoUnit.count(),
    prisma.combinedLeoUnit.findMany({
      include: combinedUnitProperties,
    }),
    prisma.officer.findMany({
      where: { status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } } },
      include: leoProperties,
      skip: options.includeAll ? undefined : options.skip,
      take: options.includeAll ? undefined : 15,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const officersWithUpdatedStatus = officers.map((u) =>
    filterInactiveUnits({ unit: u, unitsInactivityFilter }),
  );
  const combinedUnitsWithUpdatedStatus = units.map((u) =>
    filterInactiveUnits({ unit: u, unitsInactivityFilter }),
  );

  return {
    officers: [...officersWithUpdatedStatus, ...combinedUnitsWithUpdatedStatus],
    totalCount: officerCount + combinedUnitCount,
  };
}
