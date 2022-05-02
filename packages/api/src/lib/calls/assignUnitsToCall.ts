import { ShouldDoType } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { findUnit } from "lib/leo/findUnit";
import { prisma } from "lib/prisma";
import type { Socket } from "services/SocketService";

interface Options {
  callId: string;
  unitIds: string[];
  maxAssignmentsToCalls: number;
  socket?: Socket;
}

export async function assignUnitsToCall({
  socket,
  callId,
  unitIds,
  maxAssignmentsToCalls,
}: Options) {
  await Promise.all(
    unitIds.map(async (id) => {
      const { unit, type } = await findUnit(id, {
        NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
      });

      if (!unit) {
        throw new BadRequest("unitOffDuty");
      }

      const types = {
        combined: "combinedLeoId",
        leo: "officerId",
        "ems-fd": "emsFdDeputyId",
      };

      const assignmentCount = await prisma.assignedUnit.count({
        where: {
          [types[type]]: unit.id,
          call911: { ended: false },
        },
      });

      if (assignmentCount >= maxAssignmentsToCalls) {
        // skip this officer
        return;
      }

      const status = await prisma.statusValue.findFirst({
        where: { shouldDo: ShouldDoType.SET_ASSIGNED },
      });

      const t = type === "leo" ? "officer" : type === "ems-fd" ? "emsFdDeputy" : "combinedLeoUnit";

      if (status) {
        // @ts-expect-error ignore
        await prisma[t].update({
          where: { id: unit.id },
          data: { statusId: status.id },
        });
      }

      if (type !== "combined") {
        // @ts-expect-error they have the same properties for updating
        await prisma[t].update({
          where: { id: unit.id },
          data: { activeCallId: callId },
        });
      }

      if (socket) {
        await socket.emitUpdateOfficerStatus();
        await socket.emitUpdateDeputyStatus();
      }

      const assignedUnit = await prisma.assignedUnit.create({
        data: {
          call911Id: callId,
          [types[type]]: unit.id,
        },
      });

      await prisma.call911.update({
        where: {
          id: callId,
        },
        data: {
          assignedUnits: {
            connect: { id: assignedUnit.id },
          },
        },
      });
    }),
  );
}
