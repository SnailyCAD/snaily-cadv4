import type { CombinedLeoUnit, EmsFdDeputy, Officer } from "@prisma/client";
import { prisma } from "lib/data/prisma";

interface Options {
  incidentId: string;
  type: "assign" | "unassign";
  unit: Pick<EmsFdDeputy | Officer | CombinedLeoUnit, "id"> & { activeIncidentId?: string | null };
  force?: boolean;
}

/**
 * if the unit already has an active incident, move the incident to the stack.
 * once the incident is ended, `activeIncidentId` will be the latest incident in the stack.
 */
export async function getNextIncidentId(options: Options) {
  if (options.force) {
    return options.incidentId;
  }

  let nextActiveIncidentId =
    options.type === "assign"
      ? options.unit.activeIncidentId
        ? undefined
        : options.incidentId
      : null;

  if (options.type === "unassign") {
    const otherAssignedToIncident = await prisma.incidentInvolvedUnit.findFirst({
      // asc = assign to the incident assigned to after the ended incident
      orderBy: { createdAt: "asc" },
      where: {
        // find the next incident that is not the ended incident
        NOT: { incident: { id: options.incidentId, isActive: false } },
        OR: [
          { officerId: options.unit.id },
          { emsFdDeputyId: options.unit.id },
          { combinedLeoId: options.unit.id },
          { combinedEmsFdId: options.unit.id },
        ],
      },
    });

    if (otherAssignedToIncident) {
      nextActiveIncidentId = otherAssignedToIncident.incidentId;
    }
  }

  return nextActiveIncidentId;
}
