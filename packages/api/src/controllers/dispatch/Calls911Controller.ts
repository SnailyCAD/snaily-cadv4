/* eslint-disable no-dupe-class-members */
import { Controller } from "@tsed/di";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_911_CALL, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { Socket } from "../../services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth } from "../../middlewares";
import { ShouldDoType, Officer, EmsFdDeputy } from ".prisma/client";
import { unitProperties } from "../../lib/officer";

const assignedUnitsInclude = {
  include: {
    officer: {
      include: unitProperties,
    },
    deputy: {
      include: unitProperties,
    },
  },
};

@Controller("/911-calls")
@UseBeforeEach(IsAuth)
export class Calls911Controller {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async get911Calls() {
    const calls = await prisma.call911.findMany({
      include: {
        assignedUnits: assignedUnitsInclude,
        events: true,
      },
      orderBy: {
        createdAt: "desc",
      },
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
        description: body.get("description"),
        name: body.get("name"),
        userId: ctx.get("user").id,
      },
      include: {
        events: true,
        assignedUnits: assignedUnitsInclude,
      },
    });

    this.socket.emit911Call(this.officerOrDeputyToUnit(call));

    return this.officerOrDeputyToUnit(call);
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

    await prisma.call911.update({
      where: {
        id: call.id,
      },
      data: {
        location: body.get("location"),
        description: body.get("description"),
        name: body.get("name"),
        userId: ctx.get("user").id,
      },
    });

    const units = (body.get("assignedUnits") ?? []) as string[];
    await Promise.all(
      units.map(async (id) => {
        const { unit, type } = await this.findUnit(
          id,
          {
            NOT: { status: { shouldDo: ShouldDoType.SET_OFF_DUTY } },
          },
          true,
        );

        if (!unit) {
          throw new BadRequest("unitOffDuty");
        }

        const assignedUnit = await prisma.assignedUnit.create({
          data: {
            call911Id: call.id,
            [type === "leo" ? "officerId" : "emsFdDeputyId"]: unit.id,
          },
        });

        await prisma.call911.update({
          where: {
            id: call.id,
          },
          data: {
            assignedUnits: {
              connect: { id: assignedUnit.id },
            },
          },
        });
      }),
    );

    const updated = await prisma.call911.findUnique({
      where: {
        id: call.id,
      },
      include: {
        events: true,
        assignedUnits: assignedUnitsInclude,
      },
    });

    this.socket.emitUpdate911Call(this.officerOrDeputyToUnit(updated));

    return this.officerOrDeputyToUnit(updated);
  }

  @Delete("/:id")
  async end911Call(@PathParams("id") id: string) {
    const call = await prisma.call911.findUnique({
      where: { id },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    await prisma.call911.delete({
      where: {
        id: call.id,
      },
    });

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

    const { unit, type } = await this.findUnit(rawUnit, undefined, true);

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
      include: {
        events: true,
        assignedUnits: assignedUnitsInclude,
      },
    });

    this.socket.emitUpdate911Call(this.officerOrDeputyToUnit(updated));

    return this.officerOrDeputyToUnit(updated);
  }

  private async findUnit(
    id: string,
    extraFind?: any,
    withType?: false,
  ): Promise<Officer | EmsFdDeputy>;
  private async findUnit(
    id: string,
    extraFind?: any,
    withType?: true,
  ): Promise<{ unit: Officer | EmsFdDeputy; type: "leo" | "ems-fd" }>;
  private async findUnit(id: string, extraFind?: any, withType?: boolean) {
    let type: "leo" | "ems-fd" = "leo";
    let unit = await prisma.officer.findFirst({
      where: { id, ...extraFind },
    });

    if (!unit) {
      type = "ems-fd";
      unit = await prisma.emsFdDeputy.findFirst({ where: { id, ...extraFind } });
    }

    if (!unit) {
      return null;
    }

    if (withType) {
      return { type, unit };
    }

    return unit;
  }

  private officerOrDeputyToUnit(call: any & { assignedUnits: any[] }) {
    return {
      ...call,
      assignedUnits: call.assignedUnits.map((v: any) => ({
        ...v,
        officer: undefined,
        deputy: undefined,
        unit: v.officer ?? v.deputy,
      })),
    };
  }
}
