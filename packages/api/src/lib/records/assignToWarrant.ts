import { ShouldDoType } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { findUnit } from "lib/leo/findUnit";
import { prisma } from "lib/prisma";
import type { Socket } from "services/SocketService";

interface Options {
  warrantId: string;
  unitIds: string[];
  socket?: Socket;
}

export async function assignUnitsToWarrant({ socket, warrantId, unitIds }: Options) {
  await Promise.all(
    unitIds.map(async (id) => {
      const { unit, type } = await findUnit(id, {
        NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
      });

      if (!unit || type === "ems-fd") {
        throw new BadRequest("unitOffDuty");
      }

      const types = {
        combined: "combinedLeoId",
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
    }),
  );
}
