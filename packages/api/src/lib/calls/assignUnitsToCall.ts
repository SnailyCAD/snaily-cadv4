import { AssignedUnit, ShouldDoType } from "@prisma/client";
import type { Call911 } from "@prisma/client";
import { findUnit } from "lib/leo/findUnit";
import { prisma } from "lib/prisma";
import type { Socket } from "services/SocketService";
import { manyToManyHelper } from "utils/manyToMany";
import type { z } from "zod";
import type { ASSIGNED_UNIT } from "@snailycad/schemas";

interface Options {
  call: Call911 & { assignedUnits: AssignedUnit[] };
  unitIds: z.infer<typeof ASSIGNED_UNIT>[];
  maxAssignmentsToCalls: number;
  socket?: Socket;
}

export async function assignUnitsToCall({ socket, call, unitIds, maxAssignmentsToCalls }: Options) {
  const deleteCreateArr = manyToManyHelper(
    call.assignedUnits.map((u) => String(u.officerId || u.emsFdDeputyId || u.combinedLeoId)),
    unitIds.map((v) => v.id),
    { mode: "delete-create" },
  );

  await Promise.all(
    deleteCreateArr.map(async (data) => {
      const deletionId = "delete" in data && data.delete?.id;
      const creationId = "create" in data && data.create?.id;

      if (deletionId) {
        return handleDeleteAssignedUnit({ unitId: deletionId, call });
      }

      if (creationId) {
        const isPrimary = unitIds.find((v) => v.id === creationId)?.isPrimary;
        return handleCreateAssignedUnit({
          unitId: creationId,
          isPrimary: isPrimary ?? false,
          maxAssignmentsToCalls,
          call,
        });
      }

      return null;
    }),
  );

  if (socket) {
    await socket.emitUpdateOfficerStatus();
    await socket.emitUpdateDeputyStatus();
  }
}

async function handleDeleteAssignedUnit(
  options: Omit<HandleCreateAssignedUnitOptions, "maxAssignmentsToCalls" | "isPrimary">,
) {
  const types = {
    officerId: "officer",
    emsFdDeputyId: "emsFdDeputy",
    combinedLeoId: "combinedLeoUnit",
  } as const;

  const assignedUnit = await prisma.assignedUnit.findFirst({
    where: {
      call911Id: options.call.id,
      OR: [
        { officerId: options.unitId },
        { combinedLeoId: options.unitId },
        { emsFdDeputyId: options.unitId },
      ],
    },
  });
  if (!assignedUnit) return;

  const unit = await prisma.assignedUnit.delete({ where: { id: assignedUnit.id } });

  for (const type in types) {
    const key = type as keyof typeof types;
    const unitId = unit[key];
    const name = types[key];

    if (unitId) {
      // @ts-expect-error they have the same properties for updating
      await prisma[name].update({
        where: { id: unitId },
        data: { activeCallId: null },
      });
    }
  }

  return true;
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
    combined: "combinedLeoId",
    leo: "officerId",
    "ems-fd": "emsFdDeputyId",
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

  const prismaModalName =
    type === "leo" ? "officer" : type === "ems-fd" ? "emsFdDeputy" : "combinedLeoUnit";

  const status = await prisma.statusValue.findFirst({
    where: { shouldDo: ShouldDoType.SET_ASSIGNED },
  });

  if (status) {
    // @ts-expect-error ignore
    await prisma[prismaModalName].update({
      where: { id: unit.id },
      data: { statusId: status.id },
    });
  }

  // @ts-expect-error they have the same properties for updating
  await prisma[prismaModalName].update({
    where: { id: unit.id },
    data: { activeCallId: options.call.id },
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
  });

  return prisma.call911.update({
    where: { id: options.call.id },
    data: { assignedUnits: { connect: { id: assignedUnit.id } } },
  });
}
