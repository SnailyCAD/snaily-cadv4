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
import {
  ShouldDoType,
  DepartmentValue,
  DivisionValue,
  User,
  MiscCadSettings,
  Call911,
} from "@prisma/client";
import { sendDiscordWebhook } from "lib/discord/webhooks";
import type { cad } from "@snailycad/types";
import type { APIEmbed } from "discord-api-types/v10";
import { manyToManyHelper } from "utils/manyToMany";
import { Permissions, UsePermissions } from "middlewares/UsePermissions";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";
import { findUnit } from "lib/leo/findUnit";
import { getInactivityFilter } from "lib/leo/utils";

export const assignedUnitsInclude = {
  include: {
    officer: { include: _leoProperties },
    deputy: { include: unitProperties },
    combinedUnit: {
      include: {
        status: { include: { value: true } },
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

    const units = (data.assignedUnits ?? []) as string[];
    await this.assignUnitsToCall(call.id, units, maxAssignmentsToCalls);
    await this.linkOrUnlinkCallDepartmentsAndDivisions({
      type: "connect",
      departments: (data.departments ?? []) as string[],
      divisions: (data.divisions ?? []) as string[],
      callId: call.id,
    });

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    const returnData = officerOrDeputyToUnit(updated);

    try {
      const data = this.createWebhookData(returnData);
      await sendDiscordWebhook(cad.miscCadSettings, "call911WebhookId", data);
    } catch (error) {
      console.log("Could not send Discord webhook.", error);
    }

    this.socket.emit911Call(returnData);
    return returnData;
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

    await this.linkOrUnlinkCallDepartmentsAndDivisions({
      type: "disconnect",
      departments: (data.departments ?? []) as string[],
      divisions: (data.divisions ?? []) as string[],
      callId: call.id,
    });

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

    const units = (data.assignedUnits ?? []) as string[];
    await this.assignUnitsToCall(call.id, units, maxAssignmentsToCalls);
    await this.linkOrUnlinkCallDepartmentsAndDivisions({
      type: "connect",
      departments: (data.departments ?? []) as string[],
      divisions: (data.divisions ?? []) as string[],
      callId: call.id,
    });

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    this.socket.emitUpdate911Call(officerOrDeputyToUnit(updated));

    return officerOrDeputyToUnit(updated);
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

  protected async linkOrUnlinkCallDepartmentsAndDivisions({
    type,
    callId,
    departments,
    divisions,
  }: {
    type: "disconnect" | "connect";
    callId: string;
    departments: (DepartmentValue["id"] | DepartmentValue)[];
    divisions: (DivisionValue["id"] | DivisionValue)[];
  }) {
    await Promise.all(
      departments.map(async (dep) => {
        const id = typeof dep === "string" ? dep : dep.id;
        await prisma.call911.update({
          where: { id: callId },
          data: { departments: { [type]: { id } } },
        });
      }),
    );

    await Promise.all(
      divisions.map(async (division) => {
        const id = typeof division === "string" ? division : division.id;
        await prisma.call911.update({
          where: { id: callId },
          data: { divisions: { [type]: { id } } },
        });
      }),
    );
  }

  protected async endInactiveCalls(updatedAt: Date) {
    await prisma.call911.updateMany({
      where: { updatedAt: { not: { gte: updatedAt } } },
      data: {
        ended: true,
      },
    });
  }

  protected async assignUnitsToCall(
    callId: string,
    units: string[],
    maxAssignmentsToCalls: number,
  ) {
    await Promise.all(
      units.map(async (id) => {
        const { unit, type } = await findUnit(id, {
          NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
        });

        if (!unit) {
          throw new BadRequest("unitOffDuty");
        }

        const types = {
          combined: "combinedLeoId",
          leo: "officerId",
          "ems-fd": "emsFdDeputyId",
        };

        const assignmentCount = await prisma.assignedUnit.count({
          where: {
            [types[type]]: unit.id,
            call911: { ended: false },
          },
        });

        if (assignmentCount >= maxAssignmentsToCalls) {
          // skip this officer
          return;
        }

        const status = await prisma.statusValue.findFirst({
          where: { shouldDo: "SET_ASSIGNED" },
        });

        if (status) {
          const t =
            type === "leo" ? "officer" : type === "ems-fd" ? "emsFdDeputy" : "combinedLeoUnit";
          // @ts-expect-error ignore
          await prisma[t].update({
            where: { id: unit.id },
            data: { statusId: status.id },
          });

          this.socket.emitUpdateOfficerStatus();
          this.socket.emitUpdateDeputyStatus();
        }

        const assignedUnit = await prisma.assignedUnit.create({
          data: {
            call911Id: callId,
            [types[type]]: unit.id,
          },
        });

        await prisma.call911.update({
          where: {
            id: callId,
          },
          data: {
            assignedUnits: {
              connect: { id: assignedUnit.id },
            },
          },
        });
      }),
    );
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
