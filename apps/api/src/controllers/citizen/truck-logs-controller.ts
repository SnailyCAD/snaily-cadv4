import type { User } from "@prisma/client";
import { CREATE_TRUCK_LOG_SCHEMA } from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, Context, PathParams, QueryParams } from "@tsed/platform-params";
import { ContentType, Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { validateSchema } from "lib/data/validate-schema";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import type * as APITypes from "@snailycad/types/api";
import { citizenInclude } from "./CitizenController";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";

@Controller("/truck-logs")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
@IsFeatureEnabled({ feature: Feature.TRUCK_LOGS })
export class TruckLogsController {
  @Get("/")
  async getTruckLogs(
    @Context("user") user: User,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("includeAll", Boolean) includeAll = false,
  ): Promise<APITypes.GetTruckLogsData> {
    const [totalCount, logs] = await prisma.$transaction([
      prisma.truckLog.count({ where: { userId: user.id } }),
      prisma.truckLog.findMany({
        orderBy: { createdAt: "desc" },
        where: { userId: user.id },
        include: { citizen: true, vehicle: { include: citizenInclude.vehicles.include } },
        take: includeAll ? undefined : 35,
        skip: includeAll ? undefined : skip,
      }),
    ]);

    return { logs, totalCount };
  }

  @Post("/")
  async createTruckLog(
    @Context("user") user: User,
    @Context("cad") cad: { features?: Record<Feature, boolean> },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostTruckLogsData> {
    const data = validateSchema(CREATE_TRUCK_LOG_SCHEMA, body);

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: checkCitizenUserId ? user.id : undefined,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const vehicle = await prisma.registeredVehicle.findFirst({
      where: {
        id: data.vehicleId,
        userId: user.id,
        citizenId: citizen.id,
      },
    });

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    const log = await prisma.truckLog.create({
      data: {
        userId: user.id,
        citizenId: data.citizenId,
        endedAt: data.endedAt,
        startedAt: data.startedAt,
        vehicleId: data.vehicleId,
        notes: data.notes,
      },
      include: {
        citizen: true,
        vehicle: { include: citizenInclude.vehicles.include },
      },
    });

    return log;
  }

  @Put("/:id")
  async updateTruckLog(
    @Context("user") user: User,
    @Context("cad") cad: { features?: Record<Feature, boolean> },
    @BodyParams() body: unknown,
    @PathParams("id") id: string,
  ): Promise<APITypes.PutTruckLogsData> {
    const data = validateSchema(CREATE_TRUCK_LOG_SCHEMA, body);

    const log = await prisma.truckLog.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!log) {
      throw new NotFound("notFound");
    }

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: checkCitizenUserId ? user.id : undefined,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const vehicle = await prisma.registeredVehicle.findFirst({
      where: {
        id: data.vehicleId,
        userId: user.id,
        citizenId: citizen.id,
      },
    });

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    const updated = await prisma.truckLog.update({
      where: {
        id,
      },
      data: {
        citizenId: data.citizenId,
        endedAt: data.endedAt,
        vehicleId: data.vehicleId,
        notes: data.notes,
      },
      include: {
        citizen: true,
        vehicle: { include: citizenInclude.vehicles.include },
      },
    });

    return updated;
  }

  @Delete("/:id")
  async deleteTruckLog(
    @Context("cad") cad: { features?: Record<Feature, boolean> },
    @Context("user") user: User,
    @PathParams("id") id: string,
  ): Promise<APITypes.DeleteTruckLogsData> {
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const log = await prisma.truckLog.findFirst({
      where: {
        id,
        userId: checkCitizenUserId ? user.id : undefined,
      },
    });

    if (!log) {
      throw new NotFound("notFound");
    }

    await prisma.truckLog.delete({
      where: {
        id,
      },
    });

    return true;
  }
}
