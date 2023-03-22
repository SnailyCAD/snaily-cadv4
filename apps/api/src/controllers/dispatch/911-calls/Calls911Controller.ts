import { Controller } from "@tsed/di";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import {
  UPDATE_ASSIGNED_UNIT_SCHEMA,
  CALL_911_SCHEMA,
  LINK_INCIDENT_TO_CALL_SCHEMA,
  ASSIGNED_UNIT,
} from "@snailycad/schemas";
import { HeaderParams, BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { Socket } from "services/socket-service";
import { UseAfter, UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/is-auth";
import { _leoProperties } from "lib/leo/activeOfficer";
import { validateSchema } from "lib/data/validate-schema";
import {
  type cad,
  User,
  MiscCadSettings,
  Call911,
  DiscordWebhookType,
  ShouldDoType,
  Prisma,
  WhitelistStatus,
} from "@prisma/client";
import { sendDiscordWebhook, sendRawWebhook } from "lib/discord/webhooks";
import type { APIEmbed } from "discord-api-types/v10";
import { manyToManyHelper } from "lib/data/many-to-many";
import { Permissions, UsePermissions } from "middlewares/use-permissions";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { findUnit } from "lib/leo/findUnit";
import { getInactivityFilter } from "lib/leo/utils";
import { assignUnitsToCall } from "lib/calls/assignUnitsToCall";
import { linkOrUnlinkCallDepartmentsAndDivisions } from "lib/calls/linkOrUnlinkCallDepartmentsAndDivisions";
import { hasPermission } from "@snailycad/permissions";
import type * as APITypes from "@snailycad/types/api";
import {
  assignedUnitsInclude,
  incidentInclude,
} from "controllers/leo/incidents/IncidentController";
import type { z } from "zod";
import { getNextActiveCallId } from "lib/calls/getNextActiveCall";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";
import { getTranslator } from "utils/get-translator";
import { HandleInactivity } from "middlewares/handle-inactivity";
import { handleEndCall } from "lib/calls/handle-end-call";
import { AuditLogActionType, createAuditLogEntry } from "@snailycad/audit-logger/server";
import { isFeatureEnabled } from "lib/cad";

export const callInclude = {
  position: true,
  assignedUnits: assignedUnitsInclude,
  events: true,
  incidents: true,
  departments: { include: _leoProperties.department.include },
  divisions: { include: _leoProperties.division.include },
  situationCode: { include: { value: true } },
  type: { include: { value: true } },
  gtaMapPosition: true,
};

@Controller("/911-calls")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.CALLS_911 })
export class Calls911Controller {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all 911 calls")
  @UseAfter(HandleInactivity)
  async get911Calls(
    @Context("cad") cad: { miscCadSettings: MiscCadSettings | null },
    @QueryParams("includeEnded", Boolean) includeEnded?: boolean,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query = "",
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("take", Number) take = 12,
    @QueryParams("department", String) department?: string,
    @QueryParams("division", String) division?: string,
    @QueryParams("assignedUnit", String) assignedUnit?: string,
  ): Promise<APITypes.Get911CallsData> {
    const inactivityFilter = getInactivityFilter(cad, "call911InactivityTimeout");
    const inactivityFilterWhere = includeEnded ? {} : inactivityFilter?.filter;

    const where: Prisma.Call911WhereInput = {
      ...(inactivityFilterWhere ?? {}),
      ended: includeEnded ? undefined : false,
      OR: query
        ? [
            { descriptionData: { array_contains: query } },
            { name: { contains: query, mode: "insensitive" } },
            { postal: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
            { type: { value: { value: { contains: query, mode: "insensitive" } } } },
            { situationCode: { value: { value: { contains: query, mode: "insensitive" } } } },
          ]
        : undefined,
    };

    if (department || division || assignedUnit) {
      where.OR = [];
    }

    if (parseInt(query) && where.OR) {
      // @ts-expect-error this can be ignored.
      where.OR = [...Array.from(where.OR), { caseNumber: { equals: parseInt(query) } }];
    }

    if (department && where.OR) {
      // @ts-expect-error this can be ignored.
      where.OR = [...Array.from(where.OR), { departments: { some: { id: department } } }];
    }
    if (division && where.OR) {
      // @ts-expect-error this can be ignored.
      where.OR = [...Array.from(where.OR), { divisions: { some: { id: division } } }];
    }
    if (assignedUnit && where.OR) {
      where.OR = [
        ...Array.from(where.OR as any[]),
        { assignedUnits: { some: { id: assignedUnit } } },
        { assignedUnits: { some: { officerId: assignedUnit } } },
        { assignedUnits: { some: { emsFdDeputyId: assignedUnit } } },
        { assignedUnits: { some: { combinedLeoId: assignedUnit } } },
      ];
    }

    // todo
    // isFromServer
    // if the request is from the server, we want to only return information that is required to render the UI.
    // once the UI is rendered, we can then fetch the rest of the data.

    const [totalCount, calls] = await Promise.all([
      prisma.call911.count({ where }),
      prisma.call911.findMany({
        take: includeAll ? undefined : take,
        skip: includeAll ? undefined : skip,
        include: callInclude,
        orderBy: { updatedAt: "desc" },
        where,
      }),
    ]);

    return { totalCount, calls: calls.map(officerOrDeputyToUnit) };
  }

  @Get("/:id")
  @Description("Get a call by its id")
  @UsePermissions({
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async getCallById(@PathParams("id") id: string): Promise<APITypes.Get911CallByIdData> {
    const call = await prisma.call911.findUnique({
      where: { id },
      include: callInclude,
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    return officerOrDeputyToUnit(call);
  }

  @Post("/")
  async create911Call(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
    @HeaderParams("is-from-dispatch") isFromDispatchHeader?: string | undefined,
  ): Promise<APITypes.Post911CallsData> {
    const data = validateSchema(CALL_911_SCHEMA, body);
    const hasDispatchPermissions = hasPermission({
      userToCheck: user,
      permissionsToCheck: [Permissions.Dispatch],
      fallback: (user) => user.isDispatch,
    });

    const isFromDispatch = isFromDispatchHeader === "true" && hasDispatchPermissions;
    const maxAssignmentsToCalls = cad.miscCadSettings.maxAssignmentsToCalls ?? Infinity;

    const isCallApprovalEnabled = isFeatureEnabled({
      defaultReturn: false,
      feature: Feature.CALL_911_APPROVAL,
      features: cad.features,
    });
    const activeDispatchers = await prisma.activeDispatchers.count();
    const hasActiveDispatchers = activeDispatchers > 0;
    const shouldCallBePending = isCallApprovalEnabled && hasActiveDispatchers && !isFromDispatch;

    const callStatus = shouldCallBePending ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED;

    const call = await prisma.call911.create({
      data: {
        location: data.location ?? undefined,
        postal: data.postal ?? undefined,
        description: data.description ?? undefined,
        descriptionData: data.descriptionData ?? undefined,
        name: data.name ?? undefined,
        userId: user.id || undefined,
        situationCodeId: data.situationCode ?? null,
        viaDispatch: isFromDispatch,
        typeId: data.type,
        extraFields: data.extraFields || undefined,
        status: callStatus,
      },
      include: callInclude,
    });

    if (data.gtaMapPosition) {
      await prisma.gTAMapPosition.create({
        data: {
          x: data.gtaMapPosition.x,
          y: data.gtaMapPosition.y,
          z: data.gtaMapPosition.z,
          heading: data.gtaMapPosition.heading,
          Call911: { connect: { id: call.id } },
        },
      });
    }

    const unitIds = (data.assignedUnits ?? []) as z.infer<typeof ASSIGNED_UNIT>[];
    await assignUnitsToCall({
      call,
      maxAssignmentsToCalls,
      socket: this.socket,
      unitIds,
    });

    await linkOrUnlinkCallDepartmentsAndDivisions({
      departments: (data.departments ?? []) as string[],
      divisions: (data.divisions ?? []) as string[],
      call,
    });

    const updated = await prisma.call911.findUnique({
      where: { id: call.id },
      include: callInclude,
    });

    const normalizedCall = officerOrDeputyToUnit(updated);

    try {
      const data = await this.createWebhookData(normalizedCall, user.locale);
      await sendDiscordWebhook({ type: DiscordWebhookType.CALL_911, data });
      await sendRawWebhook({ type: DiscordWebhookType.CALL_911, data: normalizedCall });
    } catch (error) {
      console.error("Could not send Discord webhook.", error);
    }

    this.socket.emit911Call(normalizedCall);
    return normalizedCall;
  }

  @Put("/:id")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isEmsFd || u.isLeo,
    permissions: [Permissions.Dispatch, Permissions.EmsFd, Permissions.Leo],
  })
  async update911Call(
    @PathParams("id") id: string,
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
  ): Promise<APITypes.Put911CallByIdData> {
    const data = validateSchema(CALL_911_SCHEMA.partial(), body);
    const maxAssignmentsToCalls = cad.miscCadSettings.maxAssignmentsToCalls ?? Infinity;

    const call = await prisma.call911.findUnique({
      where: {
        id,
      },
      include: {
        assignedUnits: assignedUnitsInclude,
        departments: true,
        divisions: true,
      },
    });

    if (!call || call.ended) {
      throw new NotFound("callNotFound");
    }

    const positionData = data.position ?? null;
    const shouldRemovePosition = data.position === null;

    const position = positionData
      ? await prisma.position.upsert({
          where: {
            id: call.positionId ?? "undefined",
          },
          create: {
            lat: positionData.lat ? parseFloat(positionData.lat) : 0.0,
            lng: positionData.lng ? parseFloat(positionData.lng) : 0.0,
          },
          update: {
            lat: positionData.lat ? parseFloat(positionData.lat) : 0.0,
            lng: positionData.lng ? parseFloat(positionData.lng) : 0.0,
          },
        })
      : null;

    await prisma.call911.update({
      where: {
        id: call.id,
      },
      data: {
        location: data.location,
        postal: data.postal,
        description: data.description,
        name: data.name,
        userId: user.id,
        positionId: shouldRemovePosition ? null : position?.id ?? call.positionId,
        descriptionData: data.descriptionData ?? undefined,
        situationCodeId: data.situationCode === null ? null : data.situationCode,
        typeId: data.type,
        extraFields: data.extraFields || undefined,
        status: (data.status as WhitelistStatus | null) || undefined,
      },
    });

    if (data.gtaMapPosition) {
      const createUpdateData = {
        x: data.gtaMapPosition.x,
        y: data.gtaMapPosition.y,
        z: data.gtaMapPosition.z,
        heading: data.gtaMapPosition.heading,
      };

      await prisma.gTAMapPosition.upsert({
        where: { id: String(call.gtaMapPositionId) },
        create: createUpdateData,
        update: createUpdateData,
      });
    }

    const unitIds = (data.assignedUnits ?? []) as z.infer<typeof ASSIGNED_UNIT>[];

    if (data.assignedUnits) {
      await assignUnitsToCall({
        call,
        maxAssignmentsToCalls,
        unitIds,
      });
    }

    await Promise.all([
      this.socket.emitUpdateOfficerStatus(),
      this.socket.emitUpdateDeputyStatus(),
    ]);

    if (data.departments || data.divisions) {
      await linkOrUnlinkCallDepartmentsAndDivisions({
        departments: (data.departments ?? []) as string[],
        divisions: (data.divisions ?? []) as string[],
        call,
      });
    }

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    const normalizedCall = officerOrDeputyToUnit(updated);
    this.socket.emitUpdate911Call({
      ...normalizedCall,
      notifyAssignedUnits: data.notifyAssignedUnits,
    });

    return normalizedCall;
  }

  @Delete("/purge")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.ManageCallHistory],
  })
  async purgeCalls(
    @BodyParams("ids") ids: string[],
    @Context("sessionUserId") sessionUserId: string,
  ): Promise<APITypes.DeletePurge911CallsData> {
    if (!Array.isArray(ids)) return false;

    await Promise.all(
      ids.map(async (id) => {
        const call = await prisma.call911.delete({
          where: { id },
        });

        this.socket.emit911CallDelete(call);
      }),
    );

    await createAuditLogEntry({
      translationKey: "calls911Purged",
      action: { type: AuditLogActionType.Calls911Purge, new: ids },
      executorId: sessionUserId,
      prisma,
    });

    return true;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async end911Call(@PathParams("id") id: string): Promise<APITypes.Delete911CallByIdData> {
    const call = await prisma.call911.findUnique({
      where: { id },
      include: { assignedUnits: true },
    });

    if (!call || call.ended) {
      throw new NotFound("callNotFound");
    }

    await handleEndCall({ call, socket: this.socket });
    await Promise.all([
      this.socket.emit911CallDelete(call),
      this.socket.emitUpdateOfficerStatus(),
      this.socket.emitUpdateDeputyStatus(),
    ]);

    return true;
  }

  @Post("/link-incident/:callId")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.ManageCallHistory],
  })
  async linkCallToIncident(
    @PathParams("callId") callId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostLink911CallToIncident> {
    const data = validateSchema(LINK_INCIDENT_TO_CALL_SCHEMA, body);

    const call = await prisma.call911.findUnique({
      where: { id: callId },
      include: { incidents: true },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const disconnectConnectArr = manyToManyHelper(
      call.incidents.map((v) => v.id),
      data.incidentIds as string[],
    );

    await prisma.$transaction(
      disconnectConnectArr.map((v) =>
        prisma.call911.update({ where: { id: call.id }, data: { incidents: v } }),
      ),
    );

    const updated = await prisma.call911.findUnique({
      where: { id: call.id },
      include: { incidents: { include: incidentInclude } },
    });

    const callIncidents = updated?.incidents.map((v) => officerOrDeputyToUnit(v)) ?? [];

    return officerOrDeputyToUnit({ ...call, incidents: callIncidents });
  }

  @Post("/:type/:callId")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async assignToCall(
    @PathParams("type") callType: "assign" | "unassign",
    @PathParams("callId") callId: string,
    @BodyParams("unit") rawUnitId: string | null,
    @QueryParams("force", Boolean) force = false,
  ): Promise<APITypes.Post911CallAssignUnAssign> {
    if (!rawUnitId) {
      throw new BadRequest("unitIsRequired");
    }

    const { unit, type } = await findUnit(rawUnitId);
    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const types = {
      "combined-leo": "combinedLeoId",
      "combined-ems-fd": "combinedEmsFdId",
      leo: "officerId",
      "ems-fd": "emsFdDeputyId",
    };

    const existing = await prisma.assignedUnit.findFirst({
      where: {
        call911Id: callId,
        [types[type]]: unit.id,
      },
    });

    if (callType === "assign") {
      if (existing) {
        throw new BadRequest("alreadyAssignedToCall");
      }

      await prisma.assignedUnit.create({
        data: {
          call911Id: callId,
          [types[type]]: unit.id,
        },
      });
    } else {
      if (!existing) {
        throw new BadRequest("notAssignedToCall");
      }

      await prisma.assignedUnit.delete({
        where: { id: existing.id },
      });
    }

    const prismaNames = {
      leo: "officer",
      "ems-fd": "emsFdDeputy",
      "combined-leo": "combinedLeoUnit",
      "combined-ems-fd": "combinedEmsFdUnit",
    };

    const assignedToStatus = await prisma.statusValue.findFirst({
      where: {
        shouldDo: callType === "assign" ? ShouldDoType.SET_ASSIGNED : ShouldDoType.SET_ON_DUTY,
      },
    });

    // @ts-expect-error they have the same properties for updating
    await prisma[prismaNames[type]].update({
      where: { id: unit.id },
      data: {
        activeCallId: await getNextActiveCallId({
          callId: call.id,
          type: callType,
          unit,
          force,
        }),
        statusId: assignedToStatus?.id,
      },
    });

    await Promise.all([
      this.socket.emitUpdateOfficerStatus(),
      this.socket.emitUpdateDeputyStatus(),
    ]);

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    this.socket.emitUpdate911Call(officerOrDeputyToUnit(updated));

    return officerOrDeputyToUnit(updated);
  }

  @Put("/:callId/assigned-units/:assignedUnitId")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async updateAssignedUnit(
    @PathParams("callId") callId: string,
    @PathParams("assignedUnitId") assignedUnitId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PUT911CallAssignedUnit> {
    const data = validateSchema(UPDATE_ASSIGNED_UNIT_SCHEMA, body);

    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    if (data.isPrimary) {
      await prisma.assignedUnit.updateMany({
        where: { call911Id: call.id },
        data: { isPrimary: false },
      });
    }

    const assignedUnit = await prisma.assignedUnit.findUnique({
      where: { id: assignedUnitId },
    });

    if (!assignedUnit) {
      throw new NotFound("unitNotFound");
    }

    const updatedCall = await prisma.call911.update({
      where: { id: call.id },
      data: {
        assignedUnits: {
          update: {
            where: { id: assignedUnit.id },
            data: { isPrimary: data.isPrimary },
          },
        },
      },
      include: callInclude,
    });

    const normalizedCall = officerOrDeputyToUnit(updatedCall);
    this.socket.emitUpdate911Call(normalizedCall);

    return normalizedCall;
  }

  // creates the webhook structure that will get sent to Discord.
  private async createWebhookData(
    call: Call911,
    locale?: string | null,
  ): Promise<{ embeds: APIEmbed[] }> {
    const t = await getTranslator({ type: "webhooks", locale, namespace: "Calls" });

    const caller = call.name || t("unknown");
    const location = `${call.location} ${call.postal ? call.postal : ""}`;
    const description = call.description || t("couldNotRenderDescription");

    return {
      embeds: [
        {
          title: t("callCreated"),
          description,
          footer: { text: t("viewMoreInfo") },
          fields: [
            { name: t("location"), value: location, inline: true },
            { name: t("caller"), value: caller, inline: true },
          ],
        },
      ],
    };
  }
}
