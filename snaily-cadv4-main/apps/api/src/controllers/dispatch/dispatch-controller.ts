import { Controller } from "@tsed/di";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { BodyParams, PathParams, Context } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { Socket } from "services/socket-service";
import { UseAfter, UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/auth/is-auth";
import { type cad, Feature, type MiscCadSettings, ShouldDoType, type User } from "@snailycad/types";
import { validateSchema } from "lib/data/validate-schema";
import { TONES_SCHEMA, UPDATE_AOP_SCHEMA, UPDATE_RADIO_CHANNEL_SCHEMA } from "@snailycad/schemas";
import { getActiveOfficer } from "lib/leo/activeOfficer";
import { ExtendedNotFound } from "~/exceptions/extended-not-found";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { findUnit } from "lib/leo/findUnit";
import { getInactivityFilter } from "lib/leo/utils";
import { getActiveDeputy } from "lib/get-active-ems-fd-deputy";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import { z } from "zod";
import { ActiveToneType } from "@prisma/client";
import { HandleInactivity } from "middlewares/handle-inactivity";
import { createWhere, createWhereCombinedUnit } from "controllers/leo/create-where-obj";
import {
  leoProperties,
  unitProperties,
  combinedUnitProperties,
  combinedEmsFdUnitProperties,
} from "utils/leo/includes";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";

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
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  @UseAfter(HandleInactivity)
  async getDispatchData(
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings | null },
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.GetDispatchData> {
    const dispatcherInactivityTimeout = getInactivityFilter(
      cad,
      "activeDispatchersInactivityTimeout",
      "updatedAt",
    );

    const [activeDispatchersCount, userActiveDispatcher] = await prisma.$transaction([
      prisma.activeDispatchers.count({
        where: dispatcherInactivityTimeout?.filter,
      }),
      prisma.activeDispatchers.findFirst({
        where: { userId: sessionUserId, ...(dispatcherInactivityTimeout?.filter ?? {}) },
        include: {
          department: { include: { value: true } },
          user: { select: { username: true, id: true } },
        },
      }),
    ]);

    return {
      areaOfPlay: cad.areaOfPlay || null,
      activeDispatchersCount,
      userActiveDispatcher,
    };
  }

  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  @Post("/units/search")
  async searchUnits(
    @BodyParams("query") query: string,
  ): Promise<APITypes.PostDispatchUnitsSearchData> {
    const officers = await prisma.officer.findMany({
      where: createWhere({
        pendingOnly: false,
        query,
        type: "OFFICER",
        extraWhere: {
          combinedLeoUnitId: null,
          status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
        },
      }),
      include: leoProperties,
      take: 25,
      orderBy: { updatedAt: "desc" },
    });

    const deputies = await prisma.emsFdDeputy.findMany({
      where: createWhere({
        pendingOnly: false,
        query,
        type: "DEPUTY",
        extraWhere: {
          combinedEmsFdUnitId: null,
          status: { NOT: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
        },
      }),
      include: unitProperties,
      take: 25,
      orderBy: { updatedAt: "desc" },
    });

    const combinedOfficers = await prisma.combinedLeoUnit.findMany({
      where: createWhereCombinedUnit({
        type: "OFFICER",
        pendingOnly: false,
        query,
      }),
      include: combinedUnitProperties,
      take: 25,
      orderBy: { updatedAt: "desc" },
    });

    const combinedEmsFdDeputies = await prisma.combinedEmsFdUnit.findMany({
      where: createWhereCombinedUnit({
        type: "DEPUTY",
        pendingOnly: false,
        query,
      }),
      include: combinedEmsFdUnitProperties,
      take: 25,
      orderBy: { updatedAt: "desc" },
    });

    return [...officers, ...deputies, ...combinedOfficers, ...combinedEmsFdDeputies];
  }

  @Post("/aop")
  @Description("Update the AOP in the CAD")
  @UsePermissions({
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
    permissions: [Permissions.Dispatch],
  })
  async setSignal100(
    @Context("cad") cad: cad,
    @Context("sessionUserId") sessionUserId: string,
    @BodyParams("value") value?: boolean,
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

    await createAuditLogEntry({
      action: {
        type: AuditLogActionType.Signal100Toggled,
        new: { enabled: value, user: { id: sessionUserId } },
      },
      executorId: sessionUserId,
      prisma,
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
    permissions: [Permissions.Dispatch],
  })
  async setActiveDispatchersState(
    @Context("user") user: User,
    @Context("cad") cad: cad,
    @BodyParams("value") value: boolean,
  ): Promise<APITypes.PostDispatchDispatchersStateData> {
    let dispatcher = await prisma.activeDispatchers.findFirst({
      where: { userId: user.id },
      include: {
        user: { select: { username: true, id: true } },
        department: { include: { value: true } },
      },
    });

    if (value) {
      dispatcher =
        dispatcher ??
        (await prisma.activeDispatchers.create({
          data: { userId: user.id },
          include: {
            user: { select: { username: true, id: true } },
            department: { include: { value: true } },
          },
        }));
    } else {
      if (dispatcher) {
        await prisma.activeDispatchers.delete({
          where: { id: dispatcher.id },
        });
      }

      dispatcher = null;
    }

    const dispatcherInactivityTimeout = getInactivityFilter(
      cad,
      "activeDispatchersInactivityTimeout",
      "updatedAt",
    );
    const activeDispatchersCount = await prisma.activeDispatchers.count({
      where: dispatcherInactivityTimeout?.filter,
    });

    this.socket.emitActiveDispatchers();

    return { dispatcher, activeDispatchersCount };
  }

  @Put("/active-dispatcher")
  @Description("Update the user's active dispatcher")
  @UsePermissions({
    permissions: [Permissions.Dispatch],
  })
  async updateActiveDispatcher(
    @Context("user") user: User,
    @BodyParams("activeDepartment") activeDepartment: string | null,
  ) {
    const dispatcher = await prisma.activeDispatchers.findFirst({
      where: { userId: user.id },
      include: {
        user: { select: { username: true, id: true } },
        department: { include: { value: true } },
      },
    });

    if (!dispatcher) {
      throw new NotFound("activeDispatcherNotFound");
    }

    const updated = await prisma.activeDispatchers.update({
      where: { id: dispatcher.id },
      data: { departmentId: activeDepartment },
      include: {
        user: { select: { username: true, id: true } },
        department: { include: { value: true } },
      },
    });

    return updated;
  }

  @Put("/radio-channel/:unitId")
  @IsFeatureEnabled({ feature: Feature.RADIO_CHANNEL_MANAGEMENT })
  @UsePermissions({
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
      "combined-leo": { name: "combinedLeoUnit", include: combinedUnitProperties },
      "combined-ems-fd": {
        name: "combinedEmsFdUnit",
        include: combinedEmsFdUnitProperties,
      },
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

  @Post("/player")
  async checkPlayer(@BodyParams() body: unknown, @Context() ctx: Context) {
    const schema = z.object({ discordId: z.string().optional(), steamId: z.string().optional() });
    const data = validateSchema(schema, body);

    const user = await prisma.user.findFirst({
      where: { OR: [{ steamId: data.steamId }, { discordId: data.discordId }] },
      select: {
        username: true,
        id: true,
        permissions: true,
        rank: true,
        steamId: true,
        roles: true,
        discordId: true,
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

    // todo: replace from /players/:steamId
    // idea: in-game, if no user is found, prompt them to login via Discord or Steam and all that

    return { ...user, unit };
  }

  @Post("/players")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.LiveMap],
  })
  async getCADUsersByDiscordOrSteamId(@BodyParams() body: unknown, @Context() ctx: Context) {
    const schema = z.array(
      z.object({ discordId: z.string().optional(), steamId: z.string().optional() }),
    );
    const ids = validateSchema(schema, body);

    const users = await Promise.all(
      ids.map(async (id) => {
        const user = await prisma.user.findFirst({
          where: { OR: [{ steamId: id.steamId }, { discordId: id.discordId }] },
          select: {
            username: true,
            id: true,
            permissions: true,
            rank: true,
            steamId: true,
            roles: true,
            discordId: true,
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
      }),
    );

    return users.filter((v) => v !== null);
  }

  @Get("/players/:steamId")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.LiveMap],
  })
  async findUserBySteamId(@PathParams("steamId") steamId: string, @Context() ctx: Context) {
    const user = await prisma.user.findFirst({
      where: { steamId },
      select: {
        username: true,
        id: true,
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
  })
  async deleteToneById(@PathParams("id") id: string): Promise<APITypes.DeleteDispatchTonesData> {
    await prisma.activeTone.delete({
      where: { id },
    });
    return true;
  }
}
