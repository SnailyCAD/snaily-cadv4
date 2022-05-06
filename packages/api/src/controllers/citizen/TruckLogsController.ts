import type { CadFeature, User } from "@prisma/client";
import { CREATE_TRUCK_LOG_SCHEMA } from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, Get, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { validateSchema } from "lib/validateSchema";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";

@Controller("/truck-logs")
@UseBeforeEach(IsAuth)
export class TruckLogsController {
  @Get("/")
  async getTruckLogs(@Context("user") user: User) {
    const logs = await prisma.truckLog.findMany({
      where: {
        userId: user.id,
      },
      include: {
        citizen: true,
        vehicle: {
          include: { model: { include: { value: true } }, registrationStatus: true },
        },
      },
    });

    const registeredVehicles = await prisma.registeredVehicle.findMany({
      where: {
        userId: user.id,
      },
      include: {
        model: { include: { value: true } },
      },
    });

    return { logs, registeredVehicles };
  }

  @Post("/")
  async createTruckLog(
    @Context("user") user: User,
    @Context("cad") cad: { features: CadFeature[] },
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(CREATE_TRUCK_LOG_SCHEMA, body);

    const checkCitizenUserId = await shouldCheckCitizenUserId({ cad, user });
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
      },
      include: {
        citizen: true,
        vehicle: {
          include: {
            model: { include: { value: true } },
            registrationStatus: true,
          },
        },
      },
    });

    return log;
  }

  @Put("/:id")
  async updateTruckLog(
    @Context("user") user: User,
    @Context("cad") cad: { features: CadFeature[] },
    @BodyParams() body: unknown,
    @PathParams("id") id: string,
  ) {
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

    const checkCitizenUserId = await shouldCheckCitizenUserId({ cad, user });
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
      },
      include: {
        citizen: true,
        vehicle: {
          include: { model: { include: { value: true } }, registrationStatus: true },
        },
      },
    });

    return updated;
  }

  @Delete("/:id")
  async deleteTruckLog(
    @Context("cad") cad: { features: CadFeature[] },
    @Context("user") user: User,
    @PathParams("id") id: string,
  ) {
    const checkCitizenUserId = await shouldCheckCitizenUserId({ cad, user });
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
