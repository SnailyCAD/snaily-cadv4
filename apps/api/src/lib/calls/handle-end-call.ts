import type { AssignedUnit, Call911 } from "@prisma/client";
import { captureException } from "@sentry/node";
import { prisma } from "lib/data/prisma";
import { getPrismaNameActiveCallIncident } from "lib/leo/utils";
import type { Socket } from "services/socket-service";
import { getNextActiveCallId } from "./getNextActiveCall";

interface HandleEndCallOptions {
  socket: Socket;
  call: Pick<Call911, "id"> & { assignedUnits: AssignedUnit[] };
}

export async function handleEndCall(options: HandleEndCallOptions) {
  const call = await prisma.call911.update({
    where: { id: options.call.id },
    data: {
      ended: true,
      assignedUnits: {
        deleteMany: {
          call911Id: options.call.id,
        },
      },
    },
  });

  try {
    await Promise.allSettled(
      options.call.assignedUnits.map(async (unit) => {
        const { prismaName, unitId } = getPrismaNameActiveCallIncident({ unit });
        if (!prismaName || !unitId) return;

        const nextActiveIncidentId = await getNextActiveCallId({
          callId: options.call.id,
          type: "unassign",
          unit: { ...unit, id: unitId },
        });

        // @ts-expect-error method has the same properties
        await prisma[prismaName].update({
          where: { id: unitId },
          data: { activeCallId: nextActiveIncidentId },
        });
      }),
    );

    options.socket.emit911CallDelete(call);
  } catch (error) {
    captureException(error);
    console.log("Failed to set next call id. Skipping...");
  }
}
