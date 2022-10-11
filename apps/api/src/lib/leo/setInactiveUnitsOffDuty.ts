import type { Officer, EmsFdDeputy, CombinedLeoUnit } from "@prisma/client";

import { prisma } from "lib/prisma";

export async function setInactiveUnitsOffDuty(lastStatusChangeTimestamp: Date) {
  try {
    await prisma.$transaction([
      prisma.officer.updateMany({
        where: { lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp } },
        data: { statusId: null, activeCallId: null, activeIncidentId: null },
      }),
      prisma.emsFdDeputy.updateMany({
        where: {
          lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp },
        },
        data: { statusId: null, activeCallId: null },
      }),
      prisma.combinedLeoUnit.deleteMany({
        where: { lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp } },
      }),
    ]);
  } catch {
    console.error("unable to set units off-duty. Skipping...");
  }
}

export function filterInactiveUnits<Unit extends Officer | EmsFdDeputy | CombinedLeoUnit>({
  unit,
  unitsInactivityFilter,
}: {
  unit: Unit;
  unitsInactivityFilter: any;
}) {
  if (!unit.lastStatusChangeTimestamp || !unitsInactivityFilter?.lastStatusChangeTimestamp) {
    return unit;
  }

  if (
    unit.lastStatusChangeTimestamp.getTime() <=
    unitsInactivityFilter?.lastStatusChangeTimestamp.getTime()
  ) {
    return {
      ...unit,
      statusId: null,
      status: null,
      activeCallId: null,
      activeIncidentId: null,
    };
  }

  return unit;
}
