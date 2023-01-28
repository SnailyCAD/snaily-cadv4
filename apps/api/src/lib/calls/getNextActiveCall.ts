import type { CombinedLeoUnit, EmsFdDeputy, Officer } from "@prisma/client";
import { prisma } from "lib/data/prisma";

interface Options {
  callId: string;
  type: "assign" | "unassign";
  unit: Pick<EmsFdDeputy | Officer | CombinedLeoUnit, "id"> & { activeCallId?: string | null };
  force?: boolean;
}

/**
 * if the unit already has an active call, move the call to the stack.
 * once the call is ended, the new activeCall will be the latest call in the stack.
 */
export async function getNextActiveCallId(options: Options) {
  if (options.force) {
    return options.callId;
  }

  let nextActiveCallId =
    options.type === "assign" ? (options.unit.activeCallId ? undefined : options.callId) : null;

  if (options.type === "unassign") {
    const otherAssignedToCall = await prisma.assignedUnit.findFirst({
      // asc = assign to the call assigned to after the ended call
      orderBy: { createdAt: "asc" },
      where: {
        // find the next call that is not the ended call
        NOT: { call911: { id: options.callId, ended: true } },
        OR: [
          { officerId: options.unit.id },
          { combinedLeoId: options.unit.id },
          { combinedEmsFdId: options.unit.id },
          { emsFdDeputyId: options.unit.id },
        ],
      },
    });

    if (otherAssignedToCall) {
      nextActiveCallId = otherAssignedToCall.call911Id;
    }
  }

  return nextActiveCallId;
}
