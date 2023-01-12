import { Controller } from "@tsed/di";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { BodyParams, PathParams, Context } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Socket } from "services/socket-service";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/IsAuth";
import { cad, Feature, MiscCadSettings, User } from "@snailycad/types";
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
import { getInactivityFilter, getPrismaNameActiveCallIncident } from "lib/leo/utils";
import { filterInactiveUnits, setInactiveUnitsOffDuty } from "lib/leo/setInactiveUnitsOffDuty";
import { getActiveDeputy } from "lib/ems-fd";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import { z } from "zod";
import { ActiveToneType, IncidentInvolvedUnit } from "@prisma/client";
import { getNextIncidentId } from "lib/incidents/get-next-incident-id";

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
  ): Promise<APITypes.GetDispatchData> {
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

    if (unitsInactivityFilter) {
      setInactiveUnitsOffDuty(unitsInactivityFilter.lastStatusChangeTimestamp, this.socket);
    }

    const [officers, units] = await prisma.$transaction([
      prisma.officer.findMany({ include: leoProperties }),
      prisma.combinedLeoUnit.findMany({ include: combinedUnitProperties }),
    ]);

    const deputies = await prisma.emsFdDeputy.findMany({
      include: unitProperties,
    });

    const activeDispatchers = await prisma.activeDispatchers.findMany({
      where: dispatcherInactivityTimeout?.filter,
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

    if (dispatcherInactivityTimeout) {
      this.endInactiveDispatchers(dispatcherInactivityTimeout.updatedAt);
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
      officers: [...officersWithUpdatedStatus, ...combinedUnitsWithUpdatedStatus],
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
    @BodyParams("callId") callId?: string,
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

    if (callId) {
      const call = await prisma.call911.findUnique({
        where: { id: callId },
      });

      if (!call) {
        throw new NotFound("callNotFound");
      }

      await prisma.call911.update({
        where: { id: call.id },
        data: { isSignal100: true },
      });
    } else if (!value) {
      await prisma.call911.updateMany({
        where: { isSignal100: true },
        data: { isSignal100: false },
      });
    }

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
  @IsFeatureEnabled({ feature: Feature.RADIO_CHANNEL_MANAGEMENT })
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

  @Post("/players")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch, Permissions.LiveMap],
  })
  async getCADUsersByDiscordOrSteamId(@BodyParams() body: unknown, @Context() ctx: Context) {
    const schema = z.array(
      z.object({ discordId: z.string().optional(), steamId: z.string().optional() }),
    );
    const ids = validateSchema(schema, body);
    const users = [];

    for (const { steamId, discordId } of ids) {
      const user = await prisma.user.findFirst({
        where: { OR: [{ steamId }, { discordId }] },
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
          discordId: true,
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

  @Get("/tones")
  @IsFeatureEnabled({ feature: Feature.TONES })
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
  })
  async getTones(): Promise<APITypes.GETDispatchTonesData> {
    const activeTones = await prisma.activeTone.findMany({
      include: { createdBy: { select: { username: true } } },
    });
    return activeTones;
  }

  @Post("/tones")
  @IsFeatureEnabled({ feature: Feature.TONES })
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
  })
  async handleTones(
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PostDispatchTonesData> {
    const data = validateSchema(TONES_SCHEMA, body);

    let type: ActiveToneType = ActiveToneType.SHARED;

    if (data.leoTone && data.emsFdTone) {
      type = ActiveToneType.SHARED;
    } else if (data.leoTone) {
      type = ActiveToneType.LEO;
    } else if (data.emsFdTone) {
      type = ActiveToneType.EMS_FD;
    }

    const activeTone = await prisma.activeTone.findUnique({ where: { type } });

    if (activeTone) {
      const updated = await prisma.activeTone.update({
        where: { id: activeTone.id },
        data: {
          createdById: user.id,
          description: data.description,
          type,
        },
        include: { createdBy: { select: { username: true } } },
      });

      this.socket.emitTones(updated);
      return true;
    }

    const created = await prisma.activeTone.create({
      data: {
        createdById: user.id,
        description: data.description,
        type,
      },
      include: { createdBy: { select: { username: true } } },
    });

    this.socket.emitTones(created);

    return true;
  }

  @Delete("/tones/:id")
  @IsFeatureEnabled({ feature: Feature.TONES })
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
  })
  async deleteToneById(@PathParams("id") id: string): Promise<APITypes.DeleteDispatchTonesData> {
    await prisma.activeTone.delete({
      where: { id },
    });
    return true;
  }

  private async endIncident(incident: { id: string; unitsInvolved: IncidentInvolvedUnit[] }) {
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

  private async endInactiveIncidents(updatedAt: Date) {
    const incidents = await prisma.leoIncident.findMany({
      where: { isActive: true, updatedAt: { not: { gte: updatedAt } } },
      select: { id: true, unitsInvolved: true },
    });

    await Promise.all(incidents.map((incident) => this.endIncident(incident)));
  }

  private async endInactiveDispatchers(updatedAt: Date) {
    const activeDispatchers = await prisma.activeDispatchers.findMany({
      where: { updatedAt: { not: { gte: updatedAt } } },
    });

    await Promise.all(
      activeDispatchers.map(async (dispatcher) => {
        await prisma.activeDispatchers.delete({ where: { id: dispatcher.id } });
      }),
    );
  }
}
