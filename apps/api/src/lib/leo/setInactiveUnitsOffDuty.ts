import type { Officer, EmsFdDeputy, CombinedLeoUnit } from "@prisma/client";
import { ShouldDoType } from "@snailycad/types";
import { prisma } from "lib/data/prisma";
import type { Socket } from "services/socket-service";
import { handleStartEndOfficerLog } from "./handleStartEndOfficerLog";

export async function setInactiveUnitsOffDuty(lastStatusChangeTimestamp: Date, socket: Socket) {
  try {
    const [officers, deputies] = await prisma.$transaction([
      prisma.officer.findMany({
        where: { lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp } },
      }),
      prisma.emsFdDeputy.findMany({
        where: {
          lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp },
        },
      }),
      prisma.combinedLeoUnit.deleteMany({
        where: { lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp } },
      }),
    ]);

    await Promise.all([
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
        where: { lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp } },
        data: { statusId: null, activeCallId: null, activeIncidentId: null },
      }),
      prisma.emsFdDeputy.updateMany({
        where: {
          lastStatusChangeTimestamp: { lte: lastStatusChangeTimestamp },
        },
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
