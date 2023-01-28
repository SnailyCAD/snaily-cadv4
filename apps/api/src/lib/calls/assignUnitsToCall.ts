import { AssignedUnit, ShouldDoType } from "@prisma/client";
import type { Call911 } from "@prisma/client";
import { findUnit } from "lib/leo/findUnit";
import { prisma } from "lib/data/prisma";
import type { Socket } from "services/socket-service";
import { manyToManyHelper } from "lib/data/many-to-many";
import type { z } from "zod";
import type { ASSIGNED_UNIT } from "@snailycad/schemas";
import { assignedUnitsInclude } from "controllers/leo/incidents/IncidentController";
import { createAssignedText } from "./createAssignedText";
import { getNextActiveCallId } from "./getNextActiveCall";

interface Options {
  call: Call911 & { assignedUnits: AssignedUnit[] };
  unitIds: z.infer<typeof ASSIGNED_UNIT>[];
  maxAssignmentsToCalls: number;
  socket?: Socket;
}

export async function assignUnitsToCall({ socket, call, unitIds, maxAssignmentsToCalls }: Options) {
  const disconnectConnectArr = manyToManyHelper(
    call.assignedUnits.map((u) => String(u.officerId || u.emsFdDeputyId || u.combinedLeoId)),
    unitIds.map((v) => v.id),
  );

  const disconnectedUnits: NonNullable<Awaited<ReturnType<typeof handleDeleteAssignedUnit>>>[] = [];
  const connectedUnits: NonNullable<Awaited<ReturnType<typeof handleDeleteAssignedUnit>>>[] = [];

  await Promise.all(
    disconnectConnectArr.map(async (data) => {
      const deletionId = "disconnect" in data && data.disconnect?.id;
      const creationId = "connect" in data && data.connect?.id;

      if (deletionId) {
        const callData = await handleDeleteAssignedUnit({ unitId: deletionId, call });
        if (!callData) return;
        disconnectedUnits.push(callData);
        return callData;
      }

      if (creationId) {
        const isPrimary = unitIds.find((v) => v.id === creationId)?.isPrimary;
        const callData = await handleCreateAssignedUnit({
          unitId: creationId,
          isPrimary: isPrimary ?? false,
          maxAssignmentsToCalls,
          call,
        });
        if (!callData) return;

        connectedUnits.push(callData.assignedUnit);
        return callData.call;
      }

      return null;
    }),
  );

  const translationData = createAssignedText({
    disconnectedUnits,
    connectedUnits,
  });
  await prisma.$transaction(
    translationData.map((data) =>
      prisma.call911Event.create({
        data: {
          call911Id: call.id,
          translationData: data as any,
          description: data.key,
        },
      }),
    ),
  );

  if (socket) {
    await socket.emitUpdateOfficerStatus();
    await socket.emitUpdateDeputyStatus();
  }
}

export async function handleDeleteAssignedUnit(
  options: Omit<HandleCreateAssignedUnitOptions, "maxAssignmentsToCalls" | "isPrimary">,
) {
  const prismaNames = {
    officerId: "officer",
    emsFdDeputyId: "emsFdDeputy",
    combinedLeoId: "combinedLeoUnit",
    combinedEmsFdId: "combinedEmsFdUnit",
  } as const;

  const assignedUnit = await prisma.assignedUnit.findFirst({
    where: {
      call911Id: options.call.id,
      OR: [
        { officerId: options.unitId },
        { emsFdDeputyId: options.unitId },
        { combinedLeoId: options.unitId },
        { combinedEmsFdId: options.unitId },
      ],
    },
    include: assignedUnitsInclude.include,
  });
  if (!assignedUnit) return;

  const unit = await prisma.assignedUnit.delete({ where: { id: assignedUnit.id } });

  for (const type in prismaNames) {
    const key = type as keyof typeof prismaNames;
    const unitId = unit[key];
    const prismaName = prismaNames[key];

    if (unitId) {
      // @ts-expect-error they have the same properties for updating
      await prisma[prismaName].update({
        where: { id: unitId },
        data: {
          activeCallId: await getNextActiveCallId({
            callId: options.call.id,
            type: "unassign",
            unit: { id: options.unitId },
          }),
        },
      });
    }
  }

  return assignedUnit;
}

interface HandleCreateAssignedUnitOptions {
  unitId: string;
  call: Call911;
  maxAssignmentsToCalls: number;
  isPrimary: boolean;
}

async function handleCreateAssignedUnit(options: HandleCreateAssignedUnitOptions) {
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

  const assignmentCount = await prisma.assignedUnit.count({
    where: {
      [types[type]]: unit.id,
      call911: { ended: false },
    },
  });

  if (assignmentCount >= options.maxAssignmentsToCalls) {
    // skip this officer
    return;
  }

  const prismaNames = {
    leo: "officer",
    "ems-fd": "emsFdDeputy",
    "combined-leo": "combinedLeoUnit",
    "combined-ems-fd": "combinedEmsFdUnit",
  } as const;
  const prismaModelName = prismaNames[type];

  const status = await prisma.statusValue.findFirst({
    where: { shouldDo: ShouldDoType.SET_ASSIGNED },
  });

  if (status) {
    // @ts-expect-error ignore
    await prisma[prismaModelName].update({
      where: { id: unit.id },
      data: { statusId: status.id },
    });
  }

  // @ts-expect-error they have the same properties for updating
  await prisma[prismaModelName].update({
    where: { id: unit.id },
    data: {
      activeCallId: await getNextActiveCallId({
        callId: options.call.id,
        type: "assign",
        unit,
      }),
    },
  });

  if (options.isPrimary) {
    await prisma.assignedUnit.updateMany({
      where: { call911Id: options.call.id },
      data: { isPrimary: false },
    });
  }

  const assignedUnit = await prisma.assignedUnit.create({
    data: {
      isPrimary: options.isPrimary,
      call911Id: options.call.id,
      [types[type]]: unit.id,
    },
    include: assignedUnitsInclude.include,
  });

  return {
    call: prisma.call911.update({
      where: { id: options.call.id },
      data: { assignedUnits: { connect: { id: assignedUnit.id } } },
    }),
    assignedUnit,
  };
}
