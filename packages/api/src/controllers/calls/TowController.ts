import { Controller, QueryParams, BodyParams, Context, UseBefore, PathParams } from "@tsed/common";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "../../lib/prisma";
import { validate, TOW_SCHEMA, UPDATE_TOW_SCHEMA } from "@snailycad/schemas";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { IsAuth } from "../../middlewares";
import { Socket } from "../../services/SocketService";
import { User } from ".prisma/client";

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
  async getTowCalls(@QueryParams("ended") includingEnded = false) {
    const calls = await prisma.towCall.findMany({
      where: includingEnded
        ? undefined
        : {
            NOT: {
              ended: true,
            },
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

    return calls;
  }

  @UseBefore(IsAuth)
  @Post("/")
  async createTowCall(@BodyParams() body: JsonRequestBody, @Context("user") user: User) {
    const error = validate(TOW_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const creatorId = body.get("creatorId");
    const plate = body.get("plate");
    const deliveryAddress = body.get("deliveryAddress");
    let citizen;

    if (creatorId) {
      const extraWhere = plate
        ? {
            OR: [
              {
                officers: { some: { citizenId: creatorId } },
              },
              {
                emsFdDeputies: { some: { citizenId: creatorId } },
              },
            ],
          }
        : {};

      citizen = await prisma.citizen.findFirst({
        where: {
          userId: user.id,
          id: creatorId,
          ...extraWhere,
        },
      });

      if (!citizen) {
        throw new NotFound("notFound");
      }
    }

    let vehicle;
    if (plate && deliveryAddress) {
      vehicle = await prisma.registeredVehicle.findUnique({
        where: {
          plate,
        },
        include: { model: { include: { value: true } } },
      });

      if (!vehicle) {
        throw new NotFound("vehicleNotFound");
      }

      await prisma.impoundedVehicle.create({
        data: {
          valueId: deliveryAddress,
          registeredVehicleId: vehicle.id,
        },
      });

      await prisma.registeredVehicle.update({
        where: {
          id: vehicle.id,
        },
        data: {
          impounded: true,
        },
      });
    }

    const call = await prisma.towCall.create({
      data: {
        creatorId: body.get("creatorId"),
        userId: user.id,
        description: body.get("description"),
        location: body.get("location"),
        deliveryAddressId: deliveryAddress || null,
        plate: vehicle?.plate.toUpperCase() ?? null,
        model: vehicle?.model.value.value ?? null,
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

    await prisma.towCall.update({
      where: {
        id: call.id,
      },
      data: {
        ended: true,
      },
    });

    await this.socket.emitTowCallEnd(call);

    return true;
  }
}
