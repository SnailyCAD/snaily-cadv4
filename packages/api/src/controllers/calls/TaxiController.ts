import { Controller, BodyParams, Context, UseBefore, PathParams } from "@tsed/common";
import { Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { TOW_SCHEMA, UPDATE_TOW_SCHEMA } from "@snailycad/schemas";
import { NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/index";
import { Socket } from "services/SocketService";
import { validateSchema } from "lib/validateSchema";

const CITIZEN_SELECTS = {
  name: true,
  surname: true,
  id: true,
};

@Controller("/taxi")
export class TowController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  async getTaxiCalls() {
    const calls = await prisma.taxiCall.findMany({
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
  async createTaxiCall(@BodyParams() body: unknown, @Context() ctx: Context) {
    const data = validateSchema(TOW_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.creatorId!,
      },
    });

    if (!citizen || citizen.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    const call = await prisma.taxiCall.create({
      data: {
        creatorId: data.creatorId,
        userId: ctx.get("user").id,
        description: data.description,
        descriptionData: data.descriptionData,
        location: data.location,
        postal: data.postal ? String(data.postal) : null,
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

    this.socket.emitCreateTaxiCall(call);

    return call;
  }

  @UseBefore(IsAuth)
  @Put("/:id")
  async updateTaxiCall(@PathParams("id") callId: string, @BodyParams() body: unknown) {
    const data = validateSchema(UPDATE_TOW_SCHEMA, body);

    const call = await prisma.taxiCall.findUnique({
      where: {
        id: callId,
      },
    });

    if (!call) {
      throw new NotFound("notFound");
    }

    const rawAssignedUnitId = data.assignedUnitId;
    const assignedUnitId =
      rawAssignedUnitId === null
        ? {
            disconnect: true,
          }
        : data.assignedUnitId
        ? { connect: { id: data.assignedUnitId } }
        : undefined;

    const updated = await prisma.taxiCall.update({
      where: {
        id: callId,
      },
      data: {
        description: data.description,
        descriptionData: data.descriptionData,
        location: data.location,
        postal: data.postal ? String(data.postal) : null,
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

    this.socket.emitUpdateTaxiCall(updated);

    return updated;
  }

  @UseBefore(IsAuth)
  @Delete("/:id")
  async deleteTowCall(@PathParams("id") callId: string) {
    const call = await prisma.taxiCall.findUnique({
      where: {
        id: callId,
      },
    });

    if (!call) {
      throw new NotFound("notFound");
    }

    await prisma.taxiCall.delete({
      where: {
        id: call.id,
      },
    });

    this.socket.emitDeleteTaxiCall(call);

    return true;
  }
}
