import type { AssignedUnit, Call911 } from "@prisma/client";
import { prisma } from "lib/data/prisma";
import { getPrismaNameActiveCallIncident } from "lib/leo/utils";
import { getNextActiveCallId } from "./getNextActiveCall";

export async function handleEndCall(call: Pick<Call911, "id"> & { assignedUnits: AssignedUnit[] }) {
  try {
    const unitPromises = call.assignedUnits.map(async (unit) => {
      const { prismaName, unitId } = getPrismaNameActiveCallIncident({ unit });
      if (!prismaName || !unitId) return;

      // @ts-expect-error method has the same properties
      return prisma[prismaName].update({
        where: { id: unitId },
        data: {
          activeCallId: await getNextActiveCallId({
            callId: call.id,
            type: "unassign",
            unit: { ...unit, id: unitId },
          }),
        },
      });
    });

    await Promise.all(unitPromises);
  } catch {
    console.log("Failed to set next call id. Skipping...");
  }

  await prisma.call911.update({
    where: { id: call.id },
    data: {
      ended: true,
      assignedUnits: {
        deleteMany: {
          call911Id: call.id,
        },
      },
    },
  });
}
