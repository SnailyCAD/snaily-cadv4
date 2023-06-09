import { ShouldDoType } from "@prisma/client";
import { findUnit } from "lib/leo/findUnit";
import { prisma } from "lib/data/prisma";
import type { Socket } from "services/socket-service";

interface Options {
  warrantId: string;
  unitIds: string[];
  socket?: Socket;
}

export async function assignUnitsToWarrant({ socket, warrantId, unitIds }: Options) {
  for (const unitId of unitIds) {
    const { unit, type } = await findUnit(unitId, {
      NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
    });

    if (!unit || type === "ems-fd" || type === "combined-ems-fd") continue;

    const types = {
      "combined-leo": "combinedLeoId",
      leo: "officerId",
    } as const;

    if (socket) {
      await socket.emitUpdateOfficerStatus();
      await socket.emitUpdateDeputyStatus();
    }

    const assignedUnit = await prisma.assignedWarrantOfficer.create({
      data: {
        warrantId,
        [types[type]]: unit.id,
      },
    });

    await prisma.warrant.update({
      where: { id: warrantId },
      data: {
        assignedOfficers: { connect: { id: assignedUnit.id } },
      },
    });
  }
}
