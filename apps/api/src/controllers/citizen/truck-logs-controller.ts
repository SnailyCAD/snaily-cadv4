import type { User } from "@prisma/client";
import { CREATE_TRUCK_LOG_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { shouldCheckCitizenUserId } from "lib/citizen/has-citizen-access";
import type * as APITypes from "@snailycad/types/api";
import { citizenInclude } from "./CitizenController";
import { Feature, IsFeatureEnabled } from "middlewares/is-enabled";
import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AuthGuard } from "~/middlewares/auth/is-auth";
import { SessionUser } from "~/decorators/user";
import { Cad } from "~/decorators/cad";
import { cad } from "@snailycad/types";

@Controller("/truck-logs")
@UseGuards(AuthGuard)
@IsFeatureEnabled({ feature: Feature.TRUCK_LOGS })
export class TruckLogsController {
  @Get("/")
  async getTruckLogs(
    @SessionUser() user: User,
    @Query("skip") skip = "0",
    @Query("includeAll") includeAll = "false",
  ): Promise<APITypes.GetTruckLogsData> {
    const [totalCount, logs] = await prisma.$transaction([
      prisma.truckLog.count({ where: { userId: user.id } }),
      prisma.truckLog.findMany({
        orderBy: { createdAt: "desc" },
        where: { userId: user.id },
        include: { citizen: true, vehicle: { include: citizenInclude.vehicles.include } },
        take: includeAll === "true" ? undefined : 35,
        skip: includeAll === "true" ? undefined : parseInt(skip),
      }),
    ]);

    return { logs, totalCount };
  }

  @Post("/")
  async createTruckLog(
    @SessionUser() user: User,
    @Cad() cad: cad & { features?: Record<Feature, boolean> },
    @Body() body: unknown,
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
      throw new NotFoundException("citizenNotFound");
    }

    const vehicle = await prisma.registeredVehicle.findFirst({
      where: {
        id: data.vehicleId,
        userId: user.id,
        citizenId: citizen.id,
      },
    });

    if (!vehicle) {
      throw new NotFoundException("vehicleNotFound");
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
    @SessionUser() user: User,
    @Cad() cad: cad & { features?: Record<Feature, boolean> },
    @Body() body: unknown,
    @Param("id") id: string,
  ): Promise<APITypes.PutTruckLogsData> {
    const data = validateSchema(CREATE_TRUCK_LOG_SCHEMA, body);

    const log = await prisma.truckLog.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!log) {
      throw new NotFoundException("notFound");
    }

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const citizen = await prisma.citizen.findFirst({
      where: {
        id: data.citizenId,
        userId: checkCitizenUserId ? user.id : undefined,
      },
    });

    if (!citizen) {
      throw new NotFoundException("citizenNotFound");
    }

    const vehicle = await prisma.registeredVehicle.findFirst({
      where: {
        id: data.vehicleId,
        userId: user.id,
        citizenId: citizen.id,
      },
    });

    if (!vehicle) {
      throw new NotFoundException("vehicleNotFound");
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
    @Cad() cad: cad & { features?: Record<Feature, boolean> },
    @SessionUser() user: User,
    @Param("id") id: string,
  ): Promise<APITypes.DeleteTruckLogsData> {
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const log = await prisma.truckLog.findFirst({
      where: {
        id,
        userId: checkCitizenUserId ? user.id : undefined,
      },
    });

    if (!log) {
      throw new NotFoundException("notFound");
    }

    await prisma.truckLog.delete({
      where: {
        id,
      },
    });

    return true;
  }
}
