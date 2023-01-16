import type { IncidentInvolvedUnit } from "@prisma/client";
import type { cad } from "@snailycad/types";
import { Context, Inject, Injectable, Middleware, MiddlewareMethods, Next } from "@tsed/common";
import { handleEndCall } from "lib/calls/handle-end-call";
import { prisma } from "lib/data/prisma";
import { getNextIncidentId } from "lib/incidents/get-next-incident-id";
import { setInactiveUnitsOffDuty } from "lib/leo/setInactiveUnitsOffDuty";
import { getInactivityFilter, getPrismaNameActiveCallIncident } from "lib/leo/utils";
import { Socket } from "services/socket-service";

@Middleware()
@Injectable()
export class HandleInactivity implements MiddlewareMethods {
  @Inject(Socket)
  protected socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  public async use(@Context("cad") cad: cad, @Next() next: Next) {
    next();

    const unitsInactivityFilter = getInactivityFilter(
      cad,
      "unitInactivityTimeout",
      "lastStatusChangeTimestamp",
    );

    const dispatcherInactivityTimeout = getInactivityFilter(
      cad,
      "activeDispatchersInactivityTimeout",
      "updatedAt",
    );

    const incidentInactivityFilter = getInactivityFilter(cad, "incidentInactivityTimeout");
    if (incidentInactivityFilter) {
      await this.endInactiveIncidents(incidentInactivityFilter.updatedAt);
    }

    if (dispatcherInactivityTimeout) {
      await this.endInactiveDispatchers(dispatcherInactivityTimeout.updatedAt);
    }

    if (unitsInactivityFilter) {
      await setInactiveUnitsOffDuty(unitsInactivityFilter.lastStatusChangeTimestamp, this.socket);
    }

    const boloInactivityTimeout = getInactivityFilter(cad, "boloInactivityTimeout");
    if (boloInactivityTimeout) {
      await this.endInactiveBolos(boloInactivityTimeout.updatedAt);
    }

    const activeWarrantsInactivityTimeout = getInactivityFilter(
      cad,
      "activeWarrantsInactivityTimeout",
    );
    if (activeWarrantsInactivityTimeout) {
      await this.endInactiveWarrants(activeWarrantsInactivityTimeout.updatedAt);
    }
  }

  protected async endInactiveIncidents(updatedAt: Date) {
    const incidents = await prisma.leoIncident.findMany({
      where: { isActive: true, updatedAt: { not: { gte: updatedAt } } },
      select: { id: true, unitsInvolved: true },
    });

    await Promise.allSettled(incidents.map((incident) => this.endIncident(incident)));
  }

  protected async endInactiveDispatchers(updatedAt: Date) {
    const activeDispatchers = await prisma.activeDispatchers.findMany({
      where: { updatedAt: { not: { gte: updatedAt } } },
    });

    await Promise.allSettled(
      activeDispatchers.map(async (dispatcher) => {
        await prisma.activeDispatchers.delete({ where: { id: dispatcher.id } });
      }),
    );
  }

  protected async endIncident(incident: { id: string; unitsInvolved: IncidentInvolvedUnit[] }) {
    const unitPromises = incident.unitsInvolved.map(async (unit) => {
      const { prismaName, unitId } = getPrismaNameActiveCallIncident({ unit });
      if (!prismaName || !unitId) return;

      const nextActiveIncidentId = await getNextIncidentId({
        incidentId: incident.id,
        type: "unassign",
        unit: { ...unit, id: unitId },
      });

      // @ts-expect-error method has the same properties
      return prisma[prismaName].update({
        where: { id: unitId },
        data: { activeIncidentId: nextActiveIncidentId },
      });
    });

    await Promise.all([
      ...unitPromises,
      prisma.incidentInvolvedUnit.deleteMany({ where: { incidentId: incident.id } }),
      prisma.leoIncident.update({ where: { id: incident.id }, data: { isActive: false } }),
    ]);
  }

  protected async endInactiveBolos(updatedAt: Date) {
    await prisma.bolo.deleteMany({
      where: { updatedAt: { not: { gte: updatedAt } } },
    });
  }

  protected async endInactiveCalls(updatedAt: Date) {
    try {
      const calls = await prisma.call911.findMany({
        where: { updatedAt: { not: { gte: updatedAt } } },
        select: { assignedUnits: true, id: true },
      });

      await Promise.all(calls.map((call) => handleEndCall(call)));
    } catch {
      console.log("Failed to end inactive calls. Skipping...");
    }
  }

  protected async endInactiveWarrants(updatedAt: Date) {
    await prisma.warrant.updateMany({
      where: { updatedAt: { not: { gte: updatedAt } } },
      data: { status: "INACTIVE" },
    });
  }
}
