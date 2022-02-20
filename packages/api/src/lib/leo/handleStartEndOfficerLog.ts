import { Officer, ShouldDoType } from "@prisma/client";
import { callInclude } from "controllers/dispatch/911-calls/Calls911Controller";
import { prisma } from "lib/prisma";
import type { Socket } from "services/SocketService";

interface Options {
  shouldDo: ShouldDoType;
  officer: Omit<Officer, "divisionId">;
  socket: Socket;
  userId: string;
}

export async function handleStartEndOfficerLog(options: Options) {
  /**
   * find an officer-log that has not ended yet.
   */
  const officerLog = await prisma.officerLog.findFirst({
    where: {
      officerId: options.officer.id,
      endedAt: null,
    },
  });

  if (options.shouldDo === ShouldDoType.SET_ON_DUTY) {
    /**
     * if the officer is being set on-duty, it will create the officer-log.
     */
    if (!officerLog) {
      await prisma.officerLog.create({
        data: {
          officerId: options.officer.id,
          userId: options.userId,
          startedAt: new Date(),
        },
      });
    }
  } else if (options.shouldDo === ShouldDoType.SET_OFF_DUTY) {
    const calls = await prisma.call911.findMany({
      where: {
        assignedUnits: { some: { officerId: options.officer.id } },
      },
      include: {
        assignedUnits: callInclude.assignedUnits,
      },
    });

    calls.forEach((call) => {
      /**
       * remove officer from assigned units then emit via socket
       */
      const assignedUnits = call.assignedUnits.filter((v) => v.officerId !== options.officer.id);
      options.socket.emitUpdate911Call({ ...call, assignedUnits });
    });

    // unassign officer from call
    await prisma.assignedUnit.deleteMany({
      where: {
        officerId: options.officer.id,
      },
    });

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
