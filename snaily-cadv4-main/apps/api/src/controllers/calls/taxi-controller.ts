import {
  Controller,
  BodyParams,
  Context,
  UseBefore,
  PathParams,
  UseBeforeEach,
  QueryParams,
} from "@tsed/common";
import { Description, Delete, Get, Post, Put, ContentType } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { TOW_SCHEMA, UPDATE_TOW_SCHEMA } from "@snailycad/schemas";
import { NotFound } from "@tsed/exceptions";
import { IsAuth } from "middlewares/auth/is-auth";
import { Socket } from "services/socket-service";
import { validateSchema } from "lib/data/validate-schema";
import { Feature, type Prisma, type User } from "@prisma/client";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { towIncludes } from "./tow-controller";
import type * as APITypes from "@snailycad/types/api";
import { IsFeatureEnabled } from "middlewares/is-enabled";

@Controller("/taxi")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
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
  async getTaxiCalls(
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
    @QueryParams("query", String) query = "",
  ): Promise<APITypes.GetTaxiCallsData> {
    const where: Prisma.TaxiCallWhereInput = query
      ? {
          OR: [
            {
              creator: { name: { contains: query, mode: "insensitive" } },
            },
            { description: { contains: query, mode: "insensitive" } },
            { location: { contains: query, mode: "insensitive" } },
            { postal: { contains: query, mode: "insensitive" } },
          ],
        }
      : {};

    const [totalCount, calls] = await prisma.$transaction([
      prisma.taxiCall.count({ where }),
      prisma.taxiCall.findMany({
        include: towIncludes,
        where,
        orderBy: { createdAt: "desc" },
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
      }),
    ]);

    return { calls, totalCount };
  }

  @UseBefore(IsAuth)
  @Post("/")
  @Description("Create a new taxi call")
  async createTaxiCall(
    @BodyParams() body: unknown,
    @Context("user") user: User,
  ): Promise<APITypes.PostTaxiCallsData> {
    const data = validateSchema(TOW_SCHEMA, body);

    if (data.creatorId) {
      const citizen = await prisma.citizen.findUnique({
        where: { id: data.creatorId },
      });

      canManageInvariant(citizen?.userId, user, new NotFound("notFound"));
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

  @UseBefore(IsAuth)
  @Put("/:id")
  @Description("Update a taxi call by its id")
  @UsePermissions({
    permissions: [Permissions.ManageTaxiCalls],
  })
  async updateTaxiCall(
    @PathParams("id") callId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutTaxiCallsData> {
    const data = validateSchema(UPDATE_TOW_SCHEMA, body);

    const call = await prisma.taxiCall.findUnique({
      where: { id: callId },
    });

    if (!call) {
      throw new NotFound("notFound");
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

  @UseBefore(IsAuth)
  @Delete("/:id")
  @Description("Delete a taxi call by its id")
  @UsePermissions({
    permissions: [Permissions.ManageTaxiCalls],
  })
  async endTaxiCall(@PathParams("id") callId: string): Promise<APITypes.DeleteTaxiCallsData> {
    const call = await prisma.taxiCall.findUnique({
      where: { id: callId },
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
