import { User } from ".prisma/client";
import { validate, CREATE_TRUCK_LOG_SCHEMA } from "@snailycad/schemas";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { BodyParams, Context, PathParams } from "@tsed/platform-params";
import { Delete, Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares";
import { UseBeforeEach } from "@tsed/platform-middlewares";

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
          include: {
            model: true,
            registrationStatus: true,
          },
        },
      },
    });

    const registeredVehicles = await prisma.registeredVehicle.findMany({
      where: {
        userId: user.id,
      },
      include: {
        model: true,
      },
    });

    console.log({ registeredVehicles });

    return { logs, registeredVehicles };
  }

  @Post("/")
  async createTruckLog(@Context("user") user: User, @BodyParams() body: JsonRequestBody) {
    const error = validate(CREATE_TRUCK_LOG_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: body.get("citizenId"),
        userId: user.id,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const vehicle = await prisma.registeredVehicle.findFirst({
      where: {
        id: body.get("vehicleId"),
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
        citizenId: body.get("citizenId"),
        endedAt: body.get("endedAt"),
        startedAt: body.get("startedAt"),
        vehicleId: body.get("vehicleId"),
      },
      include: {
        citizen: true,
        vehicle: {
          include: {
            model: true,
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
    @BodyParams() body: JsonRequestBody,
    @PathParams("id") id: string,
  ) {
    const error = validate(CREATE_TRUCK_LOG_SCHEMA, body.toJSON(), true);
    if (error) {
      throw new BadRequest(error);
    }

    const log = await prisma.truckLog.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!log) {
      throw new NotFound("notFound");
    }

    const citizen = await prisma.citizen.findFirst({
      where: {
        id: body.get("citizenId"),
        userId: user.id,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const vehicle = await prisma.registeredVehicle.findFirst({
      where: {
        id: body.get("vehicleId"),
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
        citizenId: body.get("citizenId"),
        endedAt: body.get("endedAt"),
        vehicleId: body.get("vehicleId"),
      },
      include: {
        citizen: true,
        vehicle: {
          include: {
            model: true,
            registrationStatus: true,
          },
        },
      },
    });

    return updated;
  }

  @Delete("/:id")
  async deleteTruckLog(@Context("user") user: User, @PathParams("id") id: string) {
    const log = await prisma.truckLog.findFirst({
      where: {
        id,
        userId: user.id,
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
