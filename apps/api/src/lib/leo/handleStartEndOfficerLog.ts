import { EmsFdDeputy, Officer, ShouldDoType } from "@prisma/client";
import { callInclude } from "controllers/dispatch/911-calls/Calls911Controller";
import { incidentInclude } from "controllers/leo/incidents/IncidentController";
import { prisma } from "lib/data/prisma";
import type { Socket } from "services/socket-service";

interface Options<Type extends "leo" | "ems-fd"> {
  shouldDo: ShouldDoType;
  unit: Type extends "leo" ? Omit<Officer, "divisionId"> : EmsFdDeputy;
  socket: Socket;
  userId?: string | null;
  type: Type;
}

function getPrismaName(type: "leo" | "ems-fd") {
  const idPropertyNames = {
    leo: "officerId",
    "ems-fd": "emsFdDeputyId",
  } as const;
  const idPropertyName = idPropertyNames[type];
  return idPropertyName;
}

export async function handleStartEndOfficerLog<Type extends "leo" | "ems-fd">(
  options: Options<Type>,
) {
  // if the unit is not assigned to a user, we can't save the officer-log.
  // limitation of temporary units.
  if (!options.userId) return;

  const idPropertyName = getPrismaName(options.type);

  /**
   * find an officer-log that has not ended yet.
   */
  const officerLog = await prisma.officerLog.findFirst({
    where: {
      [idPropertyName]: options.unit.id,
      endedAt: null,
    },
  });

  if (options.shouldDo === ShouldDoType.SET_ON_DUTY) {
    /**
     * if the unit is being set on-duty, it will create the officer-log.
     */
    if (!officerLog) {
      await prisma.officerLog.create({
        data: {
          [idPropertyName]: options.unit.id,
          userId: options.userId,
          startedAt: new Date(),
        },
      });
    }
  } else if (options.shouldDo === ShouldDoType.SET_OFF_DUTY) {
    await Promise.all([
      handleUnassignFromCalls(options),
      handleUnassignFromActiveIncident(options),
      handleSetUnitOffDuty(options),
    ]);

    /**
     * end the officer-log.
     */
    if (officerLog) {
      await prisma.officerLog.update({
        where: {
          id: officerLog.id,
        },
        data: {
          endedAt: new Date(),
        },
      });
    }
  }
}

async function handleUnassignFromCalls<Type extends "leo" | "ems-fd">(
  options: Pick<Options<Type>, "type" | "unit" | "socket">,
) {
  const idPropertyName = getPrismaName(options.type);

  const calls = await prisma.call911.findMany({
    where: {
      assignedUnits: { some: { [idPropertyName]: options.unit.id } },
    },
    include: {
      assignedUnits: callInclude.assignedUnits,
    },
  });

  calls.forEach((call) => {
    /**
     * remove officer from assigned units then emit via socket
     */
    const assignedUnits = call.assignedUnits.filter((v) => v[idPropertyName] !== options.unit.id);
    options.socket.emitUpdate911Call({ ...call, assignedUnits });
  });

  // unassign officer from call
  await prisma.assignedUnit.deleteMany({
    where: {
      [idPropertyName]: options.unit.id,
    },
  });
}

async function handleUnassignFromActiveIncident<Type extends "leo" | "ems-fd">(
  options: Pick<Options<Type>, "type" | "unit" | "socket">,
) {
  const prismaName = getPrismaName(options.type).replace("Id", "") as "officer" | "emsFdDeputy";

  // @ts-expect-error method has same properties
  const unit = await prisma[prismaName].findUnique({
    where: { id: options.unit.id },
    select: { id: true, activeIncidentId: true },
  });
  if (!unit?.activeIncidentId) return;

  const incident = await prisma.leoIncident.findUnique({
    where: { id: unit.activeIncidentId },
    include: incidentInclude,
  });
  if (!incident) return;

  /**
   * remove officer from involved officers then emit via socket
   */
  const unitsInvolved = incident.unitsInvolved.filter((v) => v.id !== options.unit.id);
  options.socket.emitUpdateActiveIncident({ ...incident, unitsInvolved });
}

async function handleSetUnitOffDuty<Type extends "leo" | "ems-fd">(
  options: Pick<Options<Type>, "type" | "unit" | "socket">,
) {
  const prismaName = getPrismaName(options.type).replace("Id", "") as "officer" | "emsFdDeputy";

  // @ts-expect-error method has same properties
  await prisma[prismaName].update({
    where: { id: options.unit.id },
    data: { statusId: null },
  });
}
