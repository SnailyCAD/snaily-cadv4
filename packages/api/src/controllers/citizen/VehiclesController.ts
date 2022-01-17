import { MiscCadSettings, User } from ".prisma/client";
import { Feature } from "@prisma/client";
import { VEHICLE_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { Delete, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { generateString } from "utils/generateString";

@Controller("/vehicles")
@UseBeforeEach(IsAuth)
export class VehiclesController {
  @Post("/")
  async registerVehicle(@Context() ctx: Context, @BodyParams() body: unknown) {
    const data = validateSchema(VEHICLE_SCHEMA, body);
    const user = ctx.get("user") as User;

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen || citizen.userId !== user.id) {
      throw new NotFound("notFound");
    }

    const existing = await prisma.registeredVehicle.findUnique({
      where: {
        plate: data.plate.toUpperCase(),
      },
    });

    if (existing) {
      throw new BadRequest("plateAlreadyInUse");
    }

    const cad = ctx.get("cad") as {
      disabledFeatures: Feature[];
      miscCadSettings?: MiscCadSettings;
    } | null;
    const plateLength = cad?.miscCadSettings?.maxPlateLength ?? 8;
    if (data.plate.length > plateLength) {
      throw new BadRequest("plateToLong");
    }

    const isCustomEnabled = cad?.disabledFeatures.includes(Feature.DISALLOW_TEXTFIELD_SELECTION);
    let modelId = data.model;

    if (isCustomEnabled) {
      const newModel = await prisma.vehicleValue.create({
        data: {
          value: {
            create: {
              isDefault: false,
              type: "VEHICLE",
              value: data.model,
            },
          },
        },
      });

      modelId = newModel.id;
    }

    const vehicle = await prisma.registeredVehicle.create({
      data: {
        plate: data.plate.toUpperCase(),
        color: data.color,
        citizenId: citizen.id,
        modelId,
        registrationStatusId: data.registrationStatus,
        // todo
        insuranceStatus: "TEST",
        vinNumber: data.vinNumber || generateString(17),
        userId: user.id,
      },
      include: {
        model: { include: { value: true } },
        registrationStatus: true,
      },
    });

    return vehicle;
  }

  @Put("/:id")
  async updateVehicle(
    @Context() ctx: Context,
    @PathParams("id") vehicleId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(VEHICLE_SCHEMA, body);

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle || vehicle.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.registeredVehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        modelId: data.model,
        color: data.color,
        registrationStatusId: data.registrationStatus,
        vinNumber: data.vinNumber || vehicle.vinNumber,
        reportedStolen: data.reportedStolen ?? false,
      },
      include: {
        model: { include: { value: true } },
        registrationStatus: true,
      },
    });

    return updated;
  }

  @Delete("/:id")
  async deleteVehicle(@Context() ctx: Context, @PathParams("id") vehicleId: string) {
    const vehicle = await prisma.registeredVehicle.findUnique({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle || vehicle.userId !== ctx.get("user").id) {
      throw new NotFound("notFound");
    }

    await prisma.registeredVehicle.delete({
      where: {
        id: vehicle.id,
      },
    });

    return true;
  }
}
