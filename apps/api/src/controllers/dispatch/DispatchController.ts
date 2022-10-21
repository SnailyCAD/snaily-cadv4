import { Controller } from "@tsed/di";
import { ContentType, Description, Get, Post, Put } from "@tsed/schema";
import { QueryParams, BodyParams, PathParams, Context } from "@tsed/platform-params";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Socket } from "services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/IsAuth";
import type { cad, MiscCadSettings, User } from "@snailycad/types";
import { validateSchema } from "lib/validateSchema";
import { TONES_SCHEMA, UPDATE_AOP_SCHEMA, UPDATE_RADIO_CHANNEL_SCHEMA } from "@snailycad/schemas";
import {
  leoProperties,
  unitProperties,
  combinedUnitProperties,
  getActiveOfficer,
} from "lib/leo/activeOfficer";
import { ExtendedNotFound } from "src/exceptions/ExtendedNotFound";
import { incidentInclude } from "controllers/leo/incidents/IncidentController";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { userProperties } from "lib/auth/getSessionUser";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { findUnit } from "lib/leo/findUnit";
import { getInactivityFilter } from "lib/leo/utils";
import { filterInactiveUnits, setInactiveUnitsOffDuty } from "lib/leo/setInactiveUnitsOffDuty";
import { getActiveDeputy } from "lib/ems-fd";
import type * as APITypes from "@snailycad/types/api";

@Controller("/dispatch")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
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
  async getDispatchData(
    @Context("cad") cad: { miscCadSettings: MiscCadSettings | null },
    @QueryParams("isServer", Boolean) isServer: boolean,
  ): Promise<APITypes.GetDispatchData> {
    const unitsInactivityFilter = getInactivityFilter(
      cad,
      "unitInactivityTimeout",
      "lastStatusChangeTimestamp",
    );

    if (unitsInactivityFilter) {
      setInactiveUnitsOffDuty(unitsInactivityFilter.lastStatusChangeTimestamp);
    }

    const [officerCount, combinedUnitsCount, officers, units] = await prisma.$transaction([
      prisma.officer.count({ orderBy: { updatedAt: "desc" } }),
      prisma.combinedLeoUnit.count(),
      prisma.officer.findMany({
        take: isServer ? 15 : undefined,
        orderBy: { updatedAt: "desc" },
        include: leoProperties,
      }),
      prisma.combinedLeoUnit.findMany({
        take: isServer ? 10 : undefined,
        include: combinedUnitProperties,
      }),
    ]);

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

    const incidentInactivityFilter = getInactivityFilter(cad, "incidentInactivityTimeout");
    if (incidentInactivityFilter) {
      this.endInactiveIncidents(incidentInactivityFilter.updatedAt);
    }

    const activeIncidents = await prisma.leoIncident.findMany({
      where: { isActive: true, ...(incidentInactivityFilter?.filter ?? {}) },
      include: incidentInclude,
    });

    const correctedIncidents = activeIncidents.map(officerOrDeputyToUnit);
    const officersWithUpdatedStatus = officers.map((u) =>
      filterInactiveUnits({ unit: u, unitsInactivityFilter }),
    );
    const deputiesWithUpdatedStatus = deputies.map((u) =>
      filterInactiveUnits({ unit: u, unitsInactivityFilter }),
    );
    const combinedUnitsWithUpdatedStatus = units.map((u) =>
      filterInactiveUnits({ unit: u, unitsInactivityFilter }),
    );

    return {
      deputies: deputiesWithUpdatedStatus,
      officers: {
        totalCount: officerCount + combinedUnitsCount,
        officers: [...officersWithUpdatedStatus, ...combinedUnitsWithUpdatedStatus],
      },
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
  async updateAreaOfPlay(
    @Context("cad") cad: cad,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostDispatchAopData> {
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
  async setSignal100(
    @Context("cad") cad: cad,
    @BodyParams("value") value: boolean,
  ): Promise<APITypes.PostDispatchSignal100Data> {
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
  async setActiveDispatchersState(
    @Context("user") user: User,
    @BodyParams("value") value: boolean,
  ): Promise<APITypes.PostDispatchDispatchersStateData> {
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
      if (dispatcher) {
        await prisma.activeDispatchers.delete({
          where: { id: dispatcher.id },
        });

        dispatcher = null;
      }
    }

    this.socket.emitActiveDispatchers();

    return { dispatcher };
  }

  @Put("/radio-channel/:unitId")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch],
  })
  async updateRadioChannel(
    @PathParams("unitId") unitId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutDispatchRadioChannelData> {
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

  @Get("/players")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch, Permissions.LiveMap],
  })
  async getCADUsersBySteamIds(
    @QueryParams("steamIds", String) steamIds: string,
    @Context() ctx: Context,
  ) {
    const users = [];

    for (const steamId of steamIds.split(",")) {
      const user = await prisma.user.findFirst({
        where: { steamId },
        select: {
          username: true,
          id: true,
          isEmsFd: true,
          isLeo: true,
          isDispatch: true,
          permissions: true,
          rank: true,
          steamId: true,
          roles: true,
        },
      });

      if (!user) {
        continue;
      }

      const [officer, deputy] = await Promise.all([
        getActiveOfficer({ user, ctx }).catch(() => null),
        getActiveDeputy({ user, ctx }).catch(() => null),
      ]);

      const unit = officer ?? deputy ?? null;

      users.push({ ...user, unit });
    }

    return users;
  }

  @Get("/players/:steamId")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch, Permissions.LiveMap],
  })
  async findUserBySteamId(@PathParams("steamId") steamId: string, @Context() ctx: Context) {
    const user = await prisma.user.findFirst({
      where: { steamId },
      select: {
        username: true,
        id: true,
        isEmsFd: true,
        isLeo: true,
        isDispatch: true,
        permissions: true,
        rank: true,
        steamId: true,
      },
    });

    if (!user) {
      return null;
    }

    const [officer, deputy] = await Promise.all([
      getActiveOfficer({ user, ctx }).catch(() => null),
      getActiveDeputy({ user, ctx }).catch(() => null),
    ]);

    const unit = officer ?? deputy ?? null;

    return { ...user, unit };
  }

  @Post("/tones")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
  })
  async handleTones(
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PostDispatchTonesData> {
    const data = validateSchema(TONES_SCHEMA, body);
    this.socket.emitTones({ ...data, user });

    return true;
  }

  private async endInactiveIncidents(updatedAt: Date) {
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
