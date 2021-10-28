import { Controller } from "@tsed/di";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { CREATE_911_CALL, validate } from "@snailycad/schemas";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "../../lib/prisma";
import { Socket } from "../../services/SocketService";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { IsAuth, IsDispatch } from "../../middlewares";
import { UseBefore } from "@tsed/common";
import { ShouldDoType } from ".prisma/client";

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
        assignedUnits: {
          include: {
            department: { include: { value: true } },
            division: { include: { value: true } },
          },
        },
        events: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return calls;
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
        assignedUnits: {
          include: {
            department: true,
            division: {
              include: {
                value: true,
              },
            },
          },
        },
      },
    });

    this.socket.emit911Call(call);

    return call;
  }

  @UseBefore(IsDispatch)
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
        assignedUnits: {
          include: {
            department: true,
            division: {
              include: {
                value: true,
              },
            },
          },
        },
      },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    // reset assignedUnits. find a better way to do this?
    await prisma.officer.updateMany({
      where: {
        call911Id: call.id,
      },
      data: {
        call911Id: null,
      },
    });

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
        const officer = await prisma.officer.findFirst({
          where: {
            id,
            status: {
              shouldDo: ShouldDoType.SET_ON_DUTY,
            },
          },
        });

        if (!officer) {
          throw new BadRequest("officerOffDuty");
        }

        await prisma.officer.update({
          where: {
            id,
          },
          data: {
            call911Id: call.id,
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
        assignedUnits: {
          include: {
            department: true,
            division: {
              include: {
                value: true,
              },
            },
          },
        },
      },
    });

    this.socket.emitUpdate911Call(updated!);

    return updated;
  }

  @UseBefore(IsDispatch)
  @Delete("/:id")
  async end911Call(@PathParams("id") id: string) {
    const call = await prisma.call911.findUnique({
      where: { id },
    });

    if (!call) {
      throw new NotFound("callNotFound");
    }

    return true;
  }

  @UseBefore(IsDispatch)
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

  @UseBefore(IsDispatch)
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

  @UseBefore(IsDispatch)
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
}
