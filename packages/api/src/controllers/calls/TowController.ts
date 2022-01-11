import { Controller, QueryParams, BodyParams, Context, UseBefore, PathParams } from "@tsed/common";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { TOW_SCHEMA, UPDATE_TOW_SCHEMA } from "@snailycad/schemas";
import { NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/index";
import { Socket } from "services/SocketService";
import { User } from ".prisma/client";
import { validateSchema } from "lib/validateSchema";

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
    const data = validateSchema(TOW_SCHEMA, body.toJSON());

    let citizen;

    if (data.creatorId) {
      const extraWhere = data.plate
        ? {
            OR: [
              {
                officers: { some: { citizenId: data.creatorId } },
              },
              {
                emsFdDeputies: { some: { citizenId: data.creatorId } },
              },
            ],
          }
        : {};

      citizen = await prisma.citizen.findFirst({
        where: {
          userId: user.id,
          id: data.creatorId,
          ...extraWhere,
        },
      });

      if (!citizen) {
        throw new NotFound("notFound");
      }
    }

    let vehicle;
    if (data.plate && data.deliveryAddress) {
      vehicle = await prisma.registeredVehicle.findUnique({
        where: { plate: data.plate },
        include: { model: { include: { value: true } } },
      });

      if (!vehicle) {
        throw new NotFound("vehicleNotFound");
      }

      await prisma.impoundedVehicle.create({
        data: {
          valueId: data.deliveryAddress,
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

      if (data.call911Id) {
        const event = await prisma.call911Event.create({
          data: {
            description: "Created a tow call",
            call911Id: data.call911Id,
          },
        });

        this.socket.emitAddCallEvent(event);
      }
    }

    const call = await prisma.towCall.create({
      data: {
        creatorId: data.creatorId,
        userId: user.id,
        description: data.description,
        location: data.location,
        postal: data.postal ? String(data.postal) : null,
        deliveryAddressId: data.deliveryAddress || null,
        plate: vehicle?.plate.toUpperCase() ?? null,
        model: vehicle?.model.value.value ?? null,
        ended: data.callCountyService || false,
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

    if (call.ended) {
      await this.socket.emitTowCallEnd(call);
    } else {
      await this.socket.emitTowCall(call);
    }

    return call;
  }

  @UseBefore(IsAuth)
  @Put("/:id")
  async updateCall(@PathParams("id") callId: string, @BodyParams() body: JsonRequestBody) {
    const data = validateSchema(UPDATE_TOW_SCHEMA, body.toJSON());

    const call = await prisma.towCall.findUnique({
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

    const updated = await prisma.towCall.update({
      where: {
        id: callId,
      },
      data: {
        description: data.description,
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

    const updated = await prisma.towCall.update({
      where: {
        id: call.id,
      },
      data: {
        ended: true,
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

    await this.socket.emitTowCallEnd(updated);

    return true;
  }
}
