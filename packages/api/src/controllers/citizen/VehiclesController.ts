import type { MiscCadSettings, User } from ".prisma/client";
import { Feature } from "@prisma/client";
import { VEHICLE_SCHEMA, DELETE_VEHICLE_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { Delete, Description, Post, Put } from "@tsed/schema";
import { canManageInvariant } from "lib/auth/user";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { generateString } from "utils/generateString";

@Controller("/vehicles")
@UseBeforeEach(IsAuth)
export class VehiclesController {
  @Post("/")
  @Description("Register a new vehicle")
  async registerVehicle(@Context() ctx: Context, @BodyParams() body: unknown) {
    const data = validateSchema(VEHICLE_SCHEMA, body);
    const user = ctx.get("user") as User;
    const cad = ctx.get("cad") as {
      disabledFeatures: Feature[];
      miscCadSettings?: MiscCadSettings;
    } | null;

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    canManageInvariant(citizen?.userId, user, new NotFound("notFound"));

    const existing = await prisma.registeredVehicle.findUnique({
      where: {
        plate: data.plate.toUpperCase(),
      },
    });

    if (existing) {
      throw new ExtendedBadRequest({ plate: "plateAlreadyInUse" });
    }

    const plateLength = cad?.miscCadSettings?.maxPlateLength ?? 8;
    if (data.plate.length > plateLength) {
      throw new ExtendedBadRequest({ plate: "plateToLong" });
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
        registrationStatusId: data.registrationStatus as string,
        vinNumber: data.vinNumber || generateString(17),
        userId: user.id || undefined,
        insuranceStatus: "",
      },
      include: {
        model: { include: { value: true } },
        registrationStatus: true,
      },
    });

    if (data.businessId && data.employeeId) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: data.employeeId,
          businessId: data.businessId,
          userId: ctx.get("user").id,
        },
        include: {
          role: true,
        },
      });

      if (!employee || employee.role?.as === "EMPLOYEE") {
        throw new NotFound("employeeNotFoundOrInvalidPermissions");
      }

      await prisma.registeredVehicle.update({
        where: { id: vehicle.id },
        data: { Business: { connect: { id: data.businessId } } },
      });
    }

    return vehicle;
  }

  @Put("/:id")
  @Description("Update a registered vehicle")
  async updateVehicle(
    @Context("user") user: User,
    @PathParams("id") vehicleId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(VEHICLE_SCHEMA, body);

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle) {
      throw new NotFound("notFound");
    }

    if (data.businessId && data.employeeId) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: data.employeeId,
          businessId: data.businessId,
          userId: user.id,
        },
        include: {
          role: true,
        },
      });

      if (!employee || employee.role?.as === "EMPLOYEE") {
        throw new NotFound("employeeNotFoundOrInvalidPermissions");
      }
    } else {
      canManageInvariant(vehicle?.userId, user, new NotFound("notFound"));
    }

    const updated = await prisma.registeredVehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        modelId: data.model,
        color: data.color,
        registrationStatusId: data.registrationStatus as string,
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
  @Description("Delete a registered vehicle")
  async deleteVehicle(
    @Context("user") user: User,
    @PathParams("id") vehicleId: string,
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(DELETE_VEHICLE_SCHEMA, body);

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle) {
      throw new NotFound("notFound");
    }

    if (data.businessId && data.employeeId) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: data.employeeId,
          businessId: data.businessId,
          userId: user.id,
        },
        include: {
          role: true,
        },
      });

      if (!employee || employee.role?.as === "EMPLOYEE") {
        throw new NotFound("employeeNotFoundOrInvalidPermissions");
      }
    } else {
      canManageInvariant(vehicle?.userId, user, new NotFound("notFound"));
    }
    await prisma.registeredVehicle.delete({
      where: {
        id: vehicle.id,
      },
    });

    return true;
  }
}
