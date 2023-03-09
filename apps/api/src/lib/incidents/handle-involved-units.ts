import { EmsFdIncident, IncidentInvolvedUnit, LeoIncident, ShouldDoType } from "@prisma/client";
import { findUnit } from "lib/leo/findUnit";
import { prisma } from "lib/data/prisma";
import type { Socket } from "services/socket-service";
import { manyToManyHelper } from "lib/data/many-to-many";
import { getNextIncidentId } from "./get-next-incident-id";

interface Options {
  type: "ems-fd" | "leo";
  incident: (LeoIncident | EmsFdIncident) & { unitsInvolved: IncidentInvolvedUnit[] };
  unitIds: string[];
  socket?: Socket;
  maxAssignmentsToIncidents: number;
}

export async function assignUnitsInvolvedToIncident(options: Options) {
  const unitsInvolved = options.incident.unitsInvolved.map((u) =>
    String(u.officerId ?? u.emsFdDeputyId ?? u.combinedLeoId),
  );

  const disconnectConnectArr = manyToManyHelper(unitsInvolved, options.unitIds);

  await Promise.all(
    disconnectConnectArr.map(async (data) => {
      const deletionId = "disconnect" in data && data.disconnect?.id;
      const creationId = "connect" in data && data.connect?.id;

      if (deletionId) {
        const incidentData = await handleDeleteInvolvedUnit({
          unitId: deletionId,
          incident: options.incident,
          maxAssignmentsToIncidents: options.maxAssignmentsToIncidents,
          type: options.type,
        });

        if (!incidentData) return;
        return incidentData;
      }

      if (creationId) {
        const incidentData = await handleCreateInvolvedUnit({
          unitId: creationId,
          incident: options.incident,
          maxAssignmentsToIncidents: options.maxAssignmentsToIncidents,
          type: options.type,
        });

        if (!incidentData) return;
        return incidentData.incident;
      }

      return null;
    }),
  );

  if (options.socket) {
    await options.socket.emitUpdateOfficerStatus();
    await options.socket.emitUpdateDeputyStatus();
  }
}

export async function handleDeleteInvolvedUnit(options: handleCreateInvolvedUnitOptions) {
  const prismaNames = {
    officerId: "officer",
    emsFdDeputyId: "emsFdDeputy",
    combinedLeoId: "combinedLeoUnit",
    combinedEmsFdId: "combinedEmsFdUnit",
  } as const;

  const incidentKey = options.type === "leo" ? "incidentId" : "emsFdIncidentId";
  const involvedUnit = await prisma.incidentInvolvedUnit.findFirst({
    where: {
      [incidentKey]: options.incident.id,
      OR: [
        { officerId: options.unitId },
        { emsFdDeputyId: options.unitId },
        { combinedLeoId: options.unitId },
        { combinedEmsFdId: options.unitId },
      ],
    },
  });
  if (!involvedUnit) return;

  const unit = await prisma.incidentInvolvedUnit.delete({ where: { id: involvedUnit.id } });

  for (const type in prismaNames) {
    const key = type as keyof typeof prismaNames;
    const unitId = unit[key];
    const prismaName = prismaNames[key];

    if (unitId) {
      // @ts-expect-error they have the same properties for updating
      await prisma[prismaName].update({
        where: { id: unitId },
        data: {
          activeIncidentId:
            options.type === "leo"
              ? await getNextIncidentId({
                  incidentId: options.incident.id,
                  type: "unassign",
                  unit: { id: options.unitId },
                })
              : undefined,
        },
      });
    }
  }

  return involvedUnit;
}

interface handleCreateInvolvedUnitOptions {
  unitId: string;
  incident: LeoIncident | EmsFdIncident;
  maxAssignmentsToIncidents: number;
  type: "ems-fd" | "leo";
}

async function handleCreateInvolvedUnit(options: handleCreateInvolvedUnitOptions) {
  const prismaName = options.type === "leo" ? "leoIncident" : "emsFdIncident";

  const { unit, type } = await findUnit(options.unitId, {
    NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
  });
  const types = {
    leo: "officerId",
    "ems-fd": "emsFdDeputyId",
    "combined-leo": "combinedLeoId",
    "combined-ems-fd": "combinedEmsFdId",
  };

  if (!unit) {
    return;
  }

  const assignmentCount = await prisma.incidentInvolvedUnit.count({
    where: {
      [types[type]]: unit.id,
      incident: { isActive: true },
    },
  });

  if (assignmentCount >= options.maxAssignmentsToIncidents) {
    // skip this unit
    return;
  }

  const prismaNames = {
    leo: "officer",
    "ems-fd": "emsFdDeputy",
    "combined-leo": "combinedLeoUnit",
    "combined-ems-fd": "combinedEmsFdUnit",
  } as const;
  const prismaModelName = prismaNames[type];

  const nextActiveIncidentId =
    options.type === "leo"
      ? await getNextIncidentId({
          incidentId: options.incident.id,
          type: "assign",
          unit,
        })
      : undefined;

  // @ts-expect-error they have the same properties for updating
  await prisma[prismaModelName].update({
    where: { id: unit.id },
    data: {
      activeIncidentId: nextActiveIncidentId,
    },
  });

  const incidentKey = options.type === "leo" ? "incidentId" : "emsFdIncidentId";
  const involvedUnit = await prisma.incidentInvolvedUnit.create({
    data: {
      [incidentKey]: options.incident.id,
      [types[type]]: unit.id,
    },
  });

  return {
    // @ts-expect-error they have the same properties for updating
    incident: prisma[prismaName].update({
      where: { id: options.incident.id },
      data: { unitsInvolved: { connect: { id: involvedUnit.id } } },
    }),
    involvedUnit,
  };
}
