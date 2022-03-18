import { Controller, BodyParams, Context, UseBefore, PathParams } from "@tsed/common";
import { Description, Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { TOW_SCHEMA, UPDATE_TOW_SCHEMA } from "@snailycad/schemas";
import { NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/IsAuth";
import { Socket } from "services/SocketService";
import { validateSchema } from "lib/validateSchema";
import type { User } from "@prisma/client";
import { canManageInvariant } from "lib/auth/user";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

const CITIZEN_SELECTS = {
  name: true,
  surname: true,
  id: true,
};

@Controller("/taxi")
export class TaxiController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all the taxi calls")
  @UsePermissions({
    permissions: [Permissions.ManageTaxiCalls, Permissions.ViewTaxiCalls, Permissions.ViewTowLogs],
    fallback: (u) => u.isTaxi,
  })
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
  @Description("Create a new taxi call")
  @UsePermissions({
    permissions: [Permissions.ManageTaxiCalls, Permissions.ViewTaxiCalls, Permissions.ViewTowLogs],
    fallback: (u) => u.isTaxi,
  })
  async createTaxiCall(@BodyParams() body: unknown, @Context("user") user: User) {
    const data = validateSchema(TOW_SCHEMA, body);

    if (data.creatorId) {
      const citizen = await prisma.citizen.findUnique({
        where: {
          id: data.creatorId!,
        },
      });

      canManageInvariant(citizen?.userId, user, new NotFound("notFound"));
    }

    const call = await prisma.taxiCall.create({
      data: {
        creatorId: data.creatorId,
        description: data.description,
        descriptionData: data.descriptionData,
        location: data.location,
        postal: data.postal ? String(data.postal) : null,
        name: data.name ?? null,
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
  @Description("Update a taxi call by its id")
  @UsePermissions({
    permissions: [Permissions.ManageTaxiCalls],
    fallback: (u) => u.isTaxi,
  })
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
        name: data.name ?? null,
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
  @Description("Delete a taxi call by its id")
  @UsePermissions({
    permissions: [Permissions.ManageTaxiCalls],
    fallback: (u) => u.isTaxi,
  })
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
