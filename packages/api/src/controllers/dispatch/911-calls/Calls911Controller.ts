import { Controller } from "@tsed/di";
import { Delete, Description, Get, Post, Put } from "@tsed/schema";
import { CREATE_911_CALL, LINK_INCIDENT_TO_CALL } from "@snailycad/schemas";
import { HeaderParams, BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Socket } from "services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/IsAuth";
import { unitProperties, _leoProperties } from "lib/leo/activeOfficer";
import { validateSchema } from "lib/validateSchema";
import { User, MiscCadSettings, Call911, DiscordWebhookType } from "@prisma/client";
import { sendDiscordWebhook } from "lib/discord/webhooks";
import type { cad } from "@snailycad/types";
import type { APIEmbed } from "discord-api-types/v10";
import { manyToManyHelper } from "utils/manyToMany";
import { Permissions, UsePermissions } from "middlewares/UsePermissions";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { findUnit } from "lib/leo/findUnit";
import { getInactivityFilter } from "lib/leo/utils";
import { assignUnitsToCall } from "lib/calls/assignUnitsToCall";
import { linkOrUnlinkCallDepartmentsAndDivisions } from "lib/calls/linkOrUnlinkCallDepartmentsAndDivisions";

export const assignedUnitsInclude = {
  include: {
    officer: { include: _leoProperties },
    deputy: { include: unitProperties },
    combinedUnit: {
      include: {
        status: { include: { value: true } },
        department: { include: { value: true } },
        officers: {
          include: _leoProperties,
        },
      },
    },
  },
};

export const callInclude = {
  position: true,
  assignedUnits: assignedUnitsInclude,
  events: true,
  incidents: true,
  departments: { include: _leoProperties.department.include },
  divisions: { include: _leoProperties.division.include },
  situationCode: { include: { value: true } },
};

@Controller("/911-calls")
@UseBeforeEach(IsAuth)
export class Calls911Controller {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all 911 calls")
  async get911Calls(
    @Context("cad") cad: { miscCadSettings: MiscCadSettings | null },
    @QueryParams("includeEnded") includeEnded: boolean,
  ) {
    const inactivityFilter = getInactivityFilter(cad);
    if (inactivityFilter) {
      this.endInactiveCalls(inactivityFilter.updatedAt);
    }

    const calls = await prisma.call911.findMany({
      include: callInclude,
      orderBy: {
        createdAt: "desc",
      },
      where: includeEnded ? undefined : { ended: false, ...(inactivityFilter?.filter ?? {}) },
    });

    return calls.map(officerOrDeputyToUnit);
  }

  @Get("/:id")
  @Description("Get an incident by its id")
  @UsePermissions({
    permissions: [Permissions.ViewIncidents, Permissions.ManageIncidents],
    fallback: (u) => u.isDispatch || u.isLeo,
  })
  async getIncidentById(@PathParams("id") id: string) {
    const call = await prisma.call911.findUnique({
      where: { id },
      include: callInclude,
    });

    return officerOrDeputyToUnit(call);
  }

  @Post("/")
  async create911Call(
    @BodyParams() body: unknown,
    @Context("user") user: User,
    @Context("cad") cad: cad & { miscCadSettings: MiscCadSettings },
    @HeaderParams("is-from-dispatch") isFromDispatchHeader: string | undefined,
  ) {
    const data = validateSchema(CREATE_911_CALL, body);
    const isFromDispatch = isFromDispatchHeader === "true" && user.isDispatch;
    const maxAssignmentsToCalls = cad.miscCadSettings.maxAssignmentsToCalls ?? Infinity;

    const call = await prisma.call911.create({
      data: {
        location: data.location,
        postal: data.postal,
        description: data.description,
        descriptionData: data.descriptionData,
        name: data.name,
        userId: user.id || undefined,
        situationCodeId: data.situationCode ?? null,
        viaDispatch: isFromDispatch,
      },
      include: callInclude,
    });

    const unitIds = (data.assignedUnits ?? []) as string[];
    await assignUnitsToCall({
      callId: call.id,
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
      const data = this.createWebhookData(normalizedCall);
      await sendDiscordWebhook(DiscordWebhookType.CALL_911, data);
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
  ) {
    const data = validateSchema(CREATE_911_CALL, body);
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

    // reset assignedUnits. find a better way to do this?
    await Promise.all(
      call.assignedUnits.map(async ({ id }) => {
        await prisma.assignedUnit.delete({
          where: { id },
        });
      }),
    );

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
        postal: String(data.postal),
        description: data.description,
        name: data.name,
        userId: user.id,
        positionId: shouldRemovePosition ? null : position?.id ?? call.positionId,
        descriptionData: data.descriptionData,
        situationCodeId: data.situationCode === null ? null : data.situationCode,
      },
    });

    const unitIds = (data.assignedUnits ?? []) as string[];
    await assignUnitsToCall({
      callId: call.id,
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
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    const normalizedCall = officerOrDeputyToUnit(updated);
    this.socket.emitUpdate911Call(normalizedCall);

    return officerOrDeputyToUnit(normalizedCall);
  }

  @Delete("/purge")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.ManageCallHistory],
  })
  async purgeCalls(@BodyParams("ids") ids: string[]) {
    if (!Array.isArray(ids)) return;

    await Promise.all(
      ids.map(async (id) => {
        const call = await prisma.call911.delete({
          where: { id },
        });

        this.socket.emit911CallDelete(call);
      }),
    );

    return true;
  }

  @Delete("/:id")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async end911Call(@PathParams("id") id: string) {
    const call = await prisma.call911.findUnique({
      where: { id },
    });

    if (!call || call.ended) {
      throw new NotFound("callNotFound");
    }

    await prisma.call911.update({
      where: {
        id: call.id,
      },
      data: {
        ended: true,
      },
    });

    this.socket.emit911CallDelete(call);

    return true;
  }

  @Post("/link-incident/:callId")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.ManageCallHistory],
  })
  async linkCallToIncident(@PathParams("callId") callId: string, @BodyParams() body: unknown) {
    const data = validateSchema(LINK_INCIDENT_TO_CALL, body);

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
      include: { incidents: true },
    });

    return updated;
  }

  @Post("/:type/:callId")
  @UsePermissions({
    fallback: (u) => u.isDispatch || u.isLeo || u.isEmsFd,
    permissions: [Permissions.Dispatch, Permissions.Leo, Permissions.EmsFd],
  })
  async assignToCall(
    @PathParams("type") callType: "assign" | "unassign",
    @PathParams("callId") callId: string,
    @BodyParams() body: any,
  ) {
    const { unit: rawUnit } = body;

    if (!rawUnit) {
      throw new BadRequest("unitIsRequired");
    }

    const { unit, type } = await findUnit(rawUnit);
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
      combined: "combinedLeoId",
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

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    this.socket.emitUpdate911Call(officerOrDeputyToUnit(updated));

    return officerOrDeputyToUnit(updated);
  }

  protected async endInactiveCalls(updatedAt: Date) {
    await prisma.call911.updateMany({
      where: { updatedAt: { not: { gte: updatedAt } } },
      data: {
        ended: true,
      },
    });
  }

  // creates the webhook structure that will get sent to Discord.
  private createWebhookData(call: Call911): { embeds: APIEmbed[] } {
    const caller = call.name;
    const location = `${call.location} ${call.postal ? call.postal : ""}`;
    const description = call.description || "Could not render description via Discord";

    return {
      embeds: [
        {
          title: "911 Call Created",
          description,
          footer: { text: "View more information on the CAD" },
          fields: [
            {
              name: "Location",
              value: location,
              inline: true,
            },
            {
              name: "Caller",
              value: caller,
              inline: true,
            },
          ],
        },
      ],
    };
  }
}
