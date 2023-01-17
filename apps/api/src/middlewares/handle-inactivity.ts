import { Feature, IncidentInvolvedUnit } from "@prisma/client";
import { captureException } from "@sentry/node";
import type { cad } from "@snailycad/types";
import { Context, Inject, Injectable, Middleware, MiddlewareMethods, Next } from "@tsed/common";
import { isFeatureEnabled } from "lib/cad";
import { handleEndCall } from "lib/calls/handle-end-call";
import { prisma } from "lib/data/prisma";
import { getNextIncidentId } from "lib/incidents/get-next-incident-id";
import { setInactiveUnitsOffDuty } from "lib/leo/setInactiveUnitsOffDuty";
import { getInactivityFilter, getPrismaNameActiveCallIncident } from "lib/leo/utils";
import { Socket } from "services/socket-service";

@Middleware()
@Injectable()
export class HandleInactivity implements MiddlewareMethods {
  FIVE_MINUTES_IN_MILLISECONDS = 1000 * 60 * 60 * 5;

  @Inject(Socket)
  protected socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  protected isCalls911Enabled(cad: cad) {
    return isFeatureEnabled({
      defaultReturn: true,
      feature: Feature.CALLS_911,
      features: cad.features,
    });
  }

  public async use(@Context("cad") cad: cad, @Next() next: Next) {
    next();

    const lastInactivitySyncTimestamp = cad.miscCadSettings?.lastInactivitySyncTimestamp;
    const isCalls911Enabled = this.isCalls911Enabled(cad);

    // only sync every 5 minutes per request
    // this is to prevent the server from being overloaded with requests
    const hasFiveMinTimeoutEnded =
      !lastInactivitySyncTimestamp ||
      this.FIVE_MINUTES_IN_MILLISECONDS - (Date.now() - lastInactivitySyncTimestamp.getTime()) < 0;

    if (!hasFiveMinTimeoutEnded) return;

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

    const callsInactivityFilter = getInactivityFilter(cad, "call911InactivityTimeout");
    if (callsInactivityFilter && isCalls911Enabled) {
      await this.endInactiveCalls(callsInactivityFilter.updatedAt);
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

    if (cad.miscCadSettingsId) {
      await prisma.miscCadSettings.update({
        where: { id: cad.miscCadSettingsId },
        data: {
          lastInactivitySyncTimestamp: new Date(),
        },
      });
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
    try {
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

      await Promise.allSettled([
        ...unitPromises,
        prisma.incidentInvolvedUnit.deleteMany({ where: { incidentId: incident.id } }),
        prisma.leoIncident.update({ where: { id: incident.id }, data: { isActive: false } }),
      ]);
    } catch (error) {
      captureException(error);
    }
  }

  protected async endInactiveBolos(updatedAt: Date) {
    await prisma.bolo.deleteMany({
      where: { updatedAt: { not: { gte: updatedAt } } },
    });
  }

  protected async endInactiveCalls(updatedAt: Date) {
    try {
      const calls = await prisma.call911.findMany({
        where: { ended: false, updatedAt: { not: { gte: updatedAt } } },
        select: { assignedUnits: true, id: true },
      });

      await Promise.allSettled(calls.map((call) => handleEndCall(call)));
    } catch (error) {
      console.log("Failed to end inactive calls. Skipping...");
      captureException(error);
    }
  }

  protected async endInactiveWarrants(updatedAt: Date) {
    await prisma.warrant.updateMany({
      where: { updatedAt: { not: { gte: updatedAt } } },
      data: { status: "INACTIVE" },
    });
  }
}
