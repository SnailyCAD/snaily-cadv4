import type { Officer, EmsFdDeputy, CombinedLeoUnit } from "@prisma/client";
import { ShouldDoType } from "@snailycad/types";
import { prisma } from "lib/data/prisma";
import type { Socket } from "services/socket-service";
import { handleStartEndOfficerLog } from "./handleStartEndOfficerLog";

export async function setInactiveUnitsOffDuty(updatedAt: Date, socket: Socket) {
  try {
    const where = {
      status: { shouldDo: { not: ShouldDoType.SET_OFF_DUTY } },
      updatedAt: { not: { gte: updatedAt } },
    };

    const [officers, deputies] = await prisma.$transaction([
      prisma.officer.findMany({ where }),
      prisma.emsFdDeputy.findMany({ where }),
      prisma.combinedLeoUnit.deleteMany({ where }),
      prisma.combinedEmsFdUnit.deleteMany({ where }),
    ]);

    // First set all units off-duty
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
    ]);

    await Promise.allSettled([
      prisma.officer.updateMany({
        where,
        data: { statusId: null, activeCallId: null, activeIncidentId: null },
      }),
      prisma.emsFdDeputy.updateMany({
        where,
        data: { statusId: null, activeCallId: null },
      }),
      ...officers.map((officer) =>
        prisma.dispatchChat.deleteMany({
          where: { unitId: officer.id },
        }),
      ),
      ...deputies.map((deputy) =>
        prisma.dispatchChat.deleteMany({
          where: { unitId: deputy.id },
        }),
      ),
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
  if (!unit.updatedAt || !unitsInactivityFilter?.updatedAt) {
    return unit;
  }

  if (unit.updatedAt.getTime() <= unitsInactivityFilter?.updatedAt.getTime()) {
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
