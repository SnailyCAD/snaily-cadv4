import { Controller } from "@tsed/di";
import { Description, Get, Post, Put } from "@tsed/schema";
import { BodyParams, PathParams, Context } from "@tsed/platform-params";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Socket } from "services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/IsAuth";
import type { cad, MiscCadSettings, User } from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { UPDATE_AOP_SCHEMA, UPDATE_RADIO_CHANNEL_SCHEMA } from "@snailycad/schemas";
import {
  leoProperties,
  unitProperties,
  combinedUnitProperties,
  getActiveOfficer,
} from "lib/leo/activeOfficer";
import { ExtendedNotFound } from "src/exceptions/ExtendedNotFound";
import { incidentInclude } from "controllers/leo/incidents/IncidentController";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { userProperties } from "lib/auth/user";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { findUnit } from "lib/leo/findUnit";
import { getInactivityFilter } from "lib/leo/utils";
import { filterInactiveUnits, setInactiveUnitsOffDuty } from "lib/leo/setInactiveUnitsOffDuty";
import { Req } from "@tsed/common";
import { getActiveDeputy } from "lib/ems-fd";

@Controller("/dispatch")
@UseBeforeEach(IsAuth)
export class DispatchController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isEmsFd || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async getDispatchData(@Context("cad") cad: { miscCadSettings: MiscCadSettings | null }) {
    const unitsInactivityFilter = getInactivityFilter(cad, "lastStatusChangeTimestamp");

    if (unitsInactivityFilter) {
      setInactiveUnitsOffDuty(unitsInactivityFilter.lastStatusChangeTimestamp);
    }

    const officers = await prisma.officer.findMany({
      include: leoProperties,
    });

    const deputies = await prisma.emsFdDeputy.findMany({
      include: unitProperties,
    });

    const activeDispatchers = await prisma.activeDispatchers.findMany({
      include: {
        user: {
          select: { id: true, username: true, rank: true, isLeo: true, isEmsFd: true },
        },
      },
    });

    const inactivityFilter = getInactivityFilter(cad);
    if (inactivityFilter) {
      this.endInactiveIncidents(inactivityFilter.updatedAt);
    }

    const activeIncidents = await prisma.leoIncident.findMany({
      where: { isActive: true, ...(inactivityFilter?.filter ?? {}) },
      include: incidentInclude,
    });

    const correctedIncidents = activeIncidents.map(officerOrDeputyToUnit);
    const officersWithUpdatedStatus = officers.map((u) =>
      filterInactiveUnits({ unit: u, unitsInactivityFilter }),
    );
    const deputiesWithUpdatedStatus = deputies.map((u) =>
      filterInactiveUnits({ unit: u, unitsInactivityFilter }),
    );

    return {
      deputies: deputiesWithUpdatedStatus,
      officers: officersWithUpdatedStatus,
      activeIncidents: correctedIncidents,
      activeDispatchers,
    };
  }

  @Post("/aop")
  @Description("Update the AOP in the CAD")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch],
  })
  async updateAreaOfPlay(@Context("cad") cad: cad, @BodyParams() body: unknown) {
    const data = validateSchema(UPDATE_AOP_SCHEMA, body);

    const updated = await prisma.cad.update({
      where: {
        id: cad.id,
      },
      data: {
        areaOfPlay: data.aop,
      },
      select: { areaOfPlay: true },
    });

    this.socket.emitUpdateAop(updated.areaOfPlay);

    return updated;
  }

  @Post("/signal-100")
  @Description("Enable or disable signal 100")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch],
  })
  async setSignal100(@Context("cad") cad: cad, @BodyParams("value") value: boolean) {
    if (typeof value !== "boolean") {
      throw new BadRequest("body.valueIsRequired");
    }

    await prisma.miscCadSettings.update({
      where: {
        id: cad.miscCadSettingsId!,
      },
      data: {
        signal100Enabled: value,
      },
    });

    this.socket.emitSignal100(value);

    return { value };
  }

  @Post("/dispatchers-state")
  @Description("Set a dispatcher active or inactive")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch],
  })
  async setActiveDispatchersState(@Context("user") user: User, @BodyParams() body: any) {
    const value = Boolean(body.value);

    let dispatcher = await prisma.activeDispatchers.findFirst({
      where: { userId: user.id },
      include: { user: { select: userProperties } },
    });

    if (value) {
      dispatcher =
        dispatcher ??
        (await prisma.activeDispatchers.create({
          data: { userId: user.id },
          include: { user: { select: userProperties } },
        }));
    } else {
      if (!dispatcher) {
        return;
      }

      await prisma.activeDispatchers.delete({
        where: { id: dispatcher.id },
      });

      dispatcher = null;
    }

    this.socket.emitActiveDispatchers();

    return { dispatcher };
  }

  @Put("/radio-channel/:unitId")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch],
  })
  async updateRadioChannel(@PathParams("unitId") unitId: string, @BodyParams() body: unknown) {
    const data = validateSchema(UPDATE_RADIO_CHANNEL_SCHEMA, body);
    const { unit, type } = await findUnit(unitId);

    if (!unit) {
      throw new ExtendedNotFound({ radioChannel: "Unit not found" });
    }

    const includesData = {
      leo: { name: "officer", include: leoProperties },
      "ems-fd": { name: "emsFdDeputy", include: unitProperties },
      combined: { name: "combinedLeoUnit", include: combinedUnitProperties },
    };

    const name = includesData[type].name;
    const include = includesData[type].include;

    // @ts-expect-error the provided properties are the same for both models.
    const updated = await prisma[name].update({
      where: { id: unitId },
      data: {
        radioChannelId: data.radioChannel,
      },
      include,
    });

    if (["leo", "combined"].includes(type)) {
      await this.socket.emitUpdateOfficerStatus();
    } else {
      await this.socket.emitUpdateDeputyStatus();
    }

    return updated;
  }

  @Get("/players/:steamId")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch],
  })
  async findUserBySteamId(
    @Req() req: Req,
    @PathParams("steamId") steamId: string,
    @Context() ctx: Context,
  ) {
    const user = await prisma.user.findFirst({
      where: { steamId },
      select: userProperties,
    });

    if (!user) {
      return null;
    }

    const [officer, deputy] = await Promise.all([
      getActiveOfficer(req, user, ctx),
      getActiveDeputy(req, user, ctx),
    ]);

    const unit = officer ?? deputy ?? null;

    if (!unit) {
      return null;
    }

    return { ...user, unit };
  }

  protected async endInactiveIncidents(updatedAt: Date) {
    const incidents = await prisma.leoIncident.findMany({
      where: { isActive: true, updatedAt: { not: { gte: updatedAt } } },
      include: { unitsInvolved: true },
    });

    await Promise.all(
      incidents.map(async (incident) => {
        const officers = incident.unitsInvolved.filter((v) => v.officerId);

        await prisma.leoIncident.update({
          where: { id: incident.id },
          data: { isActive: false },
        });

        await prisma.$transaction(
          officers.map((unit) =>
            prisma.officer.update({
              where: { id: unit.officerId! },
              data: { activeIncidentId: null },
            }),
          ),
        );
      }),
    );
  }
}
