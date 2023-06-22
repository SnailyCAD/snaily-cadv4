import { prisma } from "lib/data/prisma";
import { TOW_SCHEMA, UPDATE_TOW_SCHEMA } from "@snailycad/schemas";
import { Socket } from "services/socket-service";
import { validateSchema } from "lib/data/validate-schema";
import { Feature, User } from "@prisma/client";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { towIncludes } from "./tow-controller";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled } from "middlewares/is-enabled";
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "~/middlewares/auth/is-auth";
import { Description } from "~/decorators/description";
import { SessionUser } from "~/decorators/user";

@Controller("/taxi")
@UseGuards(AuthGuard)
@IsFeatureEnabled({ feature: Feature.TAXI })
export class TaxiController {
  private socket: Socket;
  constructor(socket: Socket) {
    this.socket = socket;
  }

  @Get("/")
  @Description("Get all the taxi calls")
  @UsePermissions({
    permissions: [Permissions.ManageTaxiCalls, Permissions.ViewTaxiCalls],
  })
  async getTaxiCalls(): Promise<APITypes.GetTaxiCallsData> {
    const calls = await prisma.taxiCall.findMany({
      include: towIncludes,
    });

    return calls;
  }

  @Post("/")
  @Description("Create a new taxi call")
  async createTaxiCall(
    @Body() body: unknown,
    @SessionUser() user: User,
  ): Promise<APITypes.PostTaxiCallsData> {
    const data = validateSchema(TOW_SCHEMA, body);

    if (data.creatorId) {
      const citizen = await prisma.citizen.findUnique({
        where: { id: data.creatorId },
      });

      canManageInvariant(citizen?.userId, user, new NotFoundException("notFound"));
    }

    const call = await prisma.taxiCall.create({
      data: {
        creatorId: data.creatorId || null,
        description: data.description,
        descriptionData: data.descriptionData || undefined,
        location: data.location,
        postal: data.postal ? String(data.postal) : null,
        name: data.name ?? null,
      },
      include: towIncludes,
    });

    this.socket.emitCreateTaxiCall(call);

    return call;
  }

  @Put("/:id")
  @Description("Update a taxi call by its id")
  @UsePermissions({
    permissions: [Permissions.ManageTaxiCalls],
  })
  async updateTaxiCall(
    @Param("id") callId: string,
    @Body() body: unknown,
  ): Promise<APITypes.PutTaxiCallsData> {
    const data = validateSchema(UPDATE_TOW_SCHEMA, body);

    const call = await prisma.taxiCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException("notFound");
    }

    const rawAssignedUnitId = data.assignedUnitId;
    const assignedUnitId =
      rawAssignedUnitId === null
        ? { disconnect: true }
        : data.assignedUnitId
        ? { connect: { id: data.assignedUnitId } }
        : undefined;

    const updated = await prisma.taxiCall.update({
      where: {
        id: callId,
      },
      data: {
        description: data.description,
        descriptionData: data.descriptionData || undefined,
        location: data.location,
        postal: data.postal ? String(data.postal) : null,
        assignedUnit: assignedUnitId,
        name: data.name ?? null,
      },
      include: towIncludes,
    });

    this.socket.emitUpdateTaxiCall(updated);

    return updated;
  }

  @Delete("/:id")
  @Description("Delete a taxi call by its id")
  @UsePermissions({
    permissions: [Permissions.ManageTaxiCalls],
  })
  async endTaxiCall(@Param("id") callId: string): Promise<APITypes.DeleteTaxiCallsData> {
    const call = await prisma.taxiCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFoundException("notFound");
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
