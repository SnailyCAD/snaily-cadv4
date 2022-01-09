import { Controller, BodyParams, Context, UseBefore, PathParams } from "@tsed/common";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validate, TOW_SCHEMA, UPDATE_TOW_SCHEMA } from "@snailycad/schemas";
import { BadRequest, NotFound } from "@tsed/exceptions";
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
  async createTaxiCall(@BodyParams() body: JsonRequestBody, @Context() ctx: Context) {
    const data = validateSchema(TOW_SCHEMA, body.toJSON());

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
        location: data.location,
        postal: data.postal,
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
  async updateTaxiCall(@PathParams("id") callId: string, @BodyParams() body: JsonRequestBody) {
    const error = validate(UPDATE_TOW_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const call = await prisma.taxiCall.findUnique({
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

    const updated = await prisma.taxiCall.update({
      where: {
        id: callId,
      },
      data: {
        description: body.get("description"),
        location: body.get("location"),
        postal: body.get("postal"),
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
