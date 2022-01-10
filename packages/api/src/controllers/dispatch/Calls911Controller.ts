import { Controller } from "@tsed/di";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_911_CALL, LINK_INCIDENT_TO_CALL, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { Socket } from "services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "middlewares/index";
import { ShouldDoType, CombinedLeoUnit, Officer, EmsFdDeputy } from ".prisma/client";
import { unitProperties, leoProperties } from "lib/officer";

const assignedUnitsInclude = {
  include: {
    officer: {
      include: leoProperties,
    },
    deputy: {
      include: unitProperties,
    },
    combinedUnit: {
      include: {
        status: { include: { value: true } },
        officers: {
          include: leoProperties,
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
};

@Controller("/911-calls")
@UseBeforeEach(IsAuth)
export class Calls911Controller {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async get911Calls(@QueryParams("includeEnded") includeEnded: boolean) {
    const calls = await prisma.call911.findMany({
      include: callInclude,
      orderBy: {
        createdAt: "desc",
      },
      where: includeEnded ? undefined : { ended: false },
    });

    return calls.map(this.officerOrDeputyToUnit);
  }

  @Post("/")
  async create911Call(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(CREATE_911_CALL, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const call = await prisma.call911.create({
      data: {
        location: body.get("location"),
        postal: body.get("postal"),
        description: body.get("description"),
        name: body.get("name"),
        userId: ctx.get("user").id,
      },
      include: callInclude,
    });

    const units = (body.get("assignedUnits") ?? []) as string[];
    await this.assignUnitsToCall(call.id, units);

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    this.socket.emit911Call(this.officerOrDeputyToUnit(updated));

    return this.officerOrDeputyToUnit(updated);
  }

  @Put("/:id")
  async update911Call(
    @PathParams("id") id: string,
    @BodyParams() body: JsonRequestBody,
    @Context() ctx: Context,
  ) {
    const error = validate(CREATE_911_CALL, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const call = await prisma.call911.findUnique({
      where: {
        id,
      },
      include: {
        assignedUnits: assignedUnitsInclude,
      },
    });

    if (!call) {
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

    const data = body.get("position") ?? null;

    const position = data
      ? await prisma.position.upsert({
          where: {
            id: call.positionId ?? "undefined",
          },
          create: {
            lat: data.lat ? parseFloat(data.lat) : 0.0,
            lng: data.lng ? parseFloat(data.lng) : 0.0,
          },
          update: {
            lat: data.lat ? parseFloat(data.lat) : 0.0,
            lng: data.lng ? parseFloat(data.lng) : 0.0,
          },
        })
      : null;

    await prisma.call911.update({
      where: {
        id: call.id,
      },
      data: {
        location: body.get("location"),
        postal: body.get("postal"),
        description: body.get("description"),
        name: body.get("name"),
        userId: ctx.get("user").id,
        positionId: position?.id ?? call.positionId,
      },
    });

    const units = (body.get("assignedUnits") ?? []) as string[];
    await this.assignUnitsToCall(call.id, units);

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    this.socket.emitUpdate911Call(this.officerOrDeputyToUnit(updated));

    return this.officerOrDeputyToUnit(updated);
  }

  @Delete("/purge")
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
  async end911Call(@PathParams("id") id: string) {
    const call = await prisma.call911.findUnique({
      where: { id },
    });

    if (!call) {
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

  @Post("/events/:callId")
  async createCallEvent(@PathParams("callId") callId: string, @BodyParams() body: JsonRequestBody) {
    if (!body.get("description")) {
      throw new BadRequest("descriptionRequired");
    }

    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const event = await prisma.call911Event.create({
      data: {
        call911Id: call.id,
        description: body.get("description"),
      },
    });

    this.socket.emitAddCallEvent(event);

    return event;
  }

  @Put("/events/:callId/:eventId")
  async updateCallEvent(
    @PathParams("callId") callId: string,
    @PathParams("eventId") eventId: string,
    @BodyParams() body: JsonRequestBody,
  ) {
    if (!body.get("description")) {
      throw new BadRequest("descriptionRequired");
    }

    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const event = await prisma.call911Event.findFirst({
      where: {
        id: eventId,
        call911Id: callId,
      },
    });

    if (!event) {
      throw new NotFound("eventNotFound");
    }

    const updated = await prisma.call911Event.update({
      where: {
        id: event.id,
      },
      data: {
        description: body.get("description"),
      },
    });

    this.socket.emitUpdateCallEvent(updated);

    return updated;
  }

  @Delete("/events/:callId/:eventId")
  async deleteCallEvent(
    @PathParams("callId") callId: string,
    @PathParams("eventId") eventId: string,
  ) {
    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const event = await prisma.call911Event.findFirst({
      where: {
        id: eventId,
        call911Id: callId,
      },
    });

    if (!event) {
      throw new NotFound("eventNotFound");
    }

    await prisma.call911Event.delete({
      where: {
        id: event.id,
      },
    });

    this.socket.emitDeleteCallEvent(event);

    return true;
  }

  @Post("/assign-to/:callId")
  async assignToCall(@PathParams("callId") callId: string, @BodyParams() body: JsonRequestBody) {
    const { unit: rawUnit } = body.toJSON();

    if (!rawUnit) {
      throw new BadRequest("unitIsRequired");
    }

    const { unit, type } = await findUnit(rawUnit, undefined, true);

    if (!unit) {
      throw new NotFound("unitNotFound");
    }

    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const existing = await prisma.assignedUnit.findFirst({
      where: {
        call911Id: callId,
        [type === "leo" ? "officerId" : "emsFdDeputyId"]: unit.id,
      },
    });

    if (existing) {
      throw new BadRequest("alreadyAssignedToCall");
    }

    await prisma.assignedUnit.create({
      data: {
        call911Id: callId,
        [type === "leo" ? "officerId" : "emsFdDeputyId"]: unit.id,
      },
    });

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: callInclude,
    });

    this.socket.emitUpdate911Call(this.officerOrDeputyToUnit(updated));

    return this.officerOrDeputyToUnit(updated);
  }

  @Post("/link-incident/:callId")
  async linkCallToIncident(
    @PathParams("callId") callId: string,
    @BodyParams() body: JsonRequestBody,
  ) {
    const error = validate(LINK_INCIDENT_TO_CALL, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const incidentId = body.get("incidentId") as string;

    const call = await prisma.call911.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    const incident = await prisma.leoIncident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) {
      throw new NotFound("incidentNotFound");
    }

    await prisma.leoIncident.update({
      where: { id: incident.id },
      data: { calls: { connect: { id: call.id } } },
    });

    return true;
  }

  private officerOrDeputyToUnit(call: any & { assignedUnits: any[] }) {
    return {
      ...call,
      assignedUnits: (call.assignedUnits ?? [])?.map((v: any) => ({
        ...v,
        officer: undefined,
        deputy: undefined,

        unit: v.officer ?? v.deputy ?? v.combinedUnit,
      })),
    };
  }

  private async assignUnitsToCall(callId: string, units: string[]) {
    await Promise.all(
      units.map(async (id) => {
        const { unit, type } = await findUnit(
          id,
          {
            NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
          },
          true,
        );

        if (!unit) {
          throw new BadRequest("unitOffDuty");
        }

        const types = {
          combined: "combinedLeoId",
          leo: "officerId",
          "ems-fd": "emsFdDeputyId",
        };

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
}

export async function findUnit(
  id: string,
  extraFind?: any,
  searchCombined?: false,
): Promise<{ unit: Officer | EmsFdDeputy | null; type: "leo" | "ems-fd" }>;
export async function findUnit(
  id: string,
  extraFind?: any,
  searchCombined?: true,
): Promise<{
  unit: Officer | EmsFdDeputy | CombinedLeoUnit | null;
  type: "leo" | "ems-fd" | "combined";
}>;
export async function findUnit(id: string, extraFind?: any, searchCombined?: boolean) {
  let type: "leo" | "ems-fd" = "leo";
  let unit: any = await prisma.officer.findFirst({
    where: { id, ...extraFind },
  });

  if (!unit) {
    type = "ems-fd";
    unit = await prisma.emsFdDeputy.findFirst({ where: { id, ...extraFind } });
  }

  if (searchCombined && !unit) {
    unit = await prisma.combinedLeoUnit.findFirst({
      where: {
        id,
      },
      include: {
        officers: { include: leoProperties },
      },
    });

    return { type: "combined", unit: unit ?? null };
  }

  return { type, unit: unit ?? null };
}
