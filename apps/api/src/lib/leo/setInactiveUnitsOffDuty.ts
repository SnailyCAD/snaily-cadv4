import type { Officer, EmsFdDeputy, CombinedLeoUnit } from "@prisma/client";
import { ShouldDoType } from "@snailycad/types";
import { prisma } from "lib/data/prisma";
import type { Socket } from "services/socket-service";
import { handleStartEndOfficerLog } from "./handleStartEndOfficerLog";

export async function setInactiveUnitsOffDuty(lastStatusChangeTimestamp: Date, socket: Socket) {
  try {
    // use setTimeout to create a delay for 10 seconds
    await new Promise((resolve) => {
      setTimeout(resolve, 10_000);
    });

    const where = {
      status: { shouldDo: { not: ShouldDoType.SET_OFF_DUTY } },
      lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp },
    };

    const [officers, deputies] = await prisma.$transaction([
      prisma.officer.findMany({ where }),
      prisma.emsFdDeputy.findMany({ where }),
      prisma.combinedLeoUnit.deleteMany({ where }),
      prisma.combinedEmsFdUnit.deleteMany({ where }),
    ]);

    await Promise.allSettled([
      ...officers.map(async (officer) =>
        handleStartEndOfficerLog({
          shouldDo: ShouldDoType.SET_OFF_DUTY,
          socket,
          type: "leo",
          unit: officer,
          userId: officer.userId,
        }),
      ),
      ...deputies.map((deputy) =>
        handleStartEndOfficerLog({
          shouldDo: ShouldDoType.SET_OFF_DUTY,
          socket,
          type: "ems-fd",
          unit: deputy,
          userId: deputy.userId,
        }),
      ),
      prisma.officer.updateMany({
        where,
        data: { statusId: null, activeCallId: null, activeIncidentId: null },
      }),
      prisma.emsFdDeputy.updateMany({
        where,
        data: { statusId: null, activeCallId: null },
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
