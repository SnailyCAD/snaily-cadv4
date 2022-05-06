import type { Officer, EmsFdDeputy } from "@prisma/client";

import { prisma } from "lib/prisma";

export async function setInactiveUnitsOffDuty(lastStatusChangeTimestamp: Date) {
  await Promise.all([
    prisma.officer.updateMany({
      where: {
        lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp },
      },
      data: { statusId: null, activeCallId: null, activeIncidentId: null },
    }),
    prisma.emsFdDeputy.updateMany({
      where: {
        lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp },
      },
      data: { statusId: null, activeCallId: null },
    }),
  ]);
}

export function filterInactiveUnits({
  unit,
  unitsInactivityFilter,
}: {
  unit: Officer | EmsFdDeputy;
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
