import { Controller, BodyParams, Context, UseBefore, PathParams } from "@tsed/common";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "../../lib/prisma";
import { validate, TOW_SCHEMA, UPDATE_TOW_SCHEMA } from "@snailycad/schemas";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { IsAuth } from "../../middlewares";
import { Socket } from "../../services/SocketService";

const CITIZEN_SELECTS = {
  name: true,
  surname: true,
  id: true,
};

@Controller("/tow")
export class TowController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async getTowCalls() {
    const calls = await prisma.towCall.findMany({
      include: {
        assignedUnit: {
          select: CITIZEN_SELECTS,
        },
        creator: {
          select: CITIZEN_SELECTS,
        },
      },
    });

    return calls;
  }

  @UseBefore(IsAuth)
  @Post("/")
  async createTowCall(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const error = validate(TOW_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: body.get("creatorId"),
      },
    });

    if (!citizen || citizen.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    const call = await prisma.towCall.create({
      data: {
        creatorId: body.get("creatorId"),
        userId: ctx.get("user").id,
        description: body.get("description"),
        location: body.get("location"),
      },
      include: {
        assignedUnit: {
          select: CITIZEN_SELECTS,
        },
        creator: {
          select: CITIZEN_SELECTS,
        },
      },
    });

    await this.socket.emitTowCall(call);

    return call;
  }

  @UseBefore(IsAuth)
  @Put("/:id")
  async updateCall(@PathParams("id") callId: string, @BodyParams() body: JsonRequestBody) {
    const error = validate(UPDATE_TOW_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const call = await prisma.towCall.findUnique({
      where: {
        id: callId,
      },
    });

    if (!call) {
      throw new NotFound("notFound");
    }

    const rawAssignedUnitId = body.get("assignedUnitId");
    const assignedUnitId =
      rawAssignedUnitId === null
        ? {
            disconnect: true,
          }
        : body.get("assignedUnitId")
        ? { connect: { id: body.get("assignedUnitId") } }
        : undefined;

    const updated = await prisma.towCall.update({
      where: {
        id: callId,
      },
      data: {
        description: body.get("description"),
        location: body.get("location"),
        assignedUnit: assignedUnitId,
      },
      include: {
        assignedUnit: {
          select: CITIZEN_SELECTS,
        },
        creator: {
          select: CITIZEN_SELECTS,
        },
      },
    });

    await this.socket.emitUpdateTowCall(updated);

    return updated;
  }

  @UseBefore(IsAuth)
  @Delete("/:id")
  async deleteTowCall(@PathParams("id") callId: string) {
    const call = await prisma.towCall.findUnique({
      where: {
        id: callId,
      },
    });

    if (!call) {
      throw new NotFound("notFound");
    }

    await prisma.towCall.delete({
      where: {
        id: call.id,
      },
    });

    await this.socket.emitCallDelete(call);

    return true;
  }
}
