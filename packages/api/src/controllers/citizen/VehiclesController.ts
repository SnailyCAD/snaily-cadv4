import { MiscCadSettings, User } from ".prisma/client";
import { Feature } from "@prisma/client";
import { validate, VEHICLE_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { Delete, JsonRequestBody, Post, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { generateString } from "utils/generateString";

@Controller("/vehicles")
@UseBeforeEach(IsAuth)
export class VehiclesController {
  @Post("/")
  async registerVehicle(@Context() ctx: Context, @BodyParams() body: JsonRequestBody) {
    const error = validate(VEHICLE_SCHEMA, body.toJSON(), true);
    const user = ctx.get("user") as User;

    if (error) {
      return new BadRequest(error);
    }

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: body.get("citizenId"),
      },
    });

    if (!citizen || citizen.userId !== user.id) {
      throw new NotFound("notFound");
    }

    const existing = await prisma.registeredVehicle.findUnique({
      where: {
        plate: body.get("plate").toUpperCase(),
      },
    });

    if (existing) {
      throw new BadRequest("plateAlreadyInUse");
    }

    const cad = ctx.get("cad") as {
      disabledFeatures: Feature[];
      miscCadSettings?: MiscCadSettings;
    };
    const plateLength = cad?.miscCadSettings?.maxPlateLength ?? 8;
    if (body.get("plate").length > plateLength) {
      throw new BadRequest("plateToLong");
    }

    const isCustomEnabled = cad?.disabledFeatures.includes(Feature.DISALLOW_TEXTFIELD_SELECTION);
    let modelId = body.get("model");

    if (isCustomEnabled) {
      const newModel = await prisma.vehicleValue.create({
        data: {
          value: {
            create: {
              isDefault: false,
              type: "VEHICLE",
              value: body.get("model"),
            },
          },
        },
      });

      modelId = newModel.id;
    }

    const vehicle = await prisma.registeredVehicle.create({
      data: {
        plate: body.get("plate").toUpperCase(),
        color: body.get("color"),
        citizenId: citizen.id,
        modelId,
        registrationStatusId: body.get("registrationStatus"),
        // todo
        insuranceStatus: "TEST",
        vinNumber: body.get("vinNumber") || generateString(17),
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
    @BodyParams() body: JsonRequestBody,
  ) {
    const error = validate(VEHICLE_SCHEMA, body.toJSON(), true);

    if (error) {
      return new BadRequest(error);
    }

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
        modelId: body.get("model"),
        color: body.get("color"),
        registrationStatusId: body.get("registrationStatus"),
        vinNumber: body.get("vinNumber") || vehicle.vinNumber,
        reportedStolen: body.get("reportedStolen") ?? false,
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
