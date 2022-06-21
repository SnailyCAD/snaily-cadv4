import {
  MiscCadSettings,
  User,
  CadFeature,
  Feature,
  VehicleInspectionStatus,
  VehicleTaxStatus,
  WhitelistStatus,
  ValueType,
  cad,
} from "@prisma/client";
import { VEHICLE_SCHEMA, DELETE_VEHICLE_SCHEMA, TRANSFER_VEHICLE_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { NotFound } from "@tsed/exceptions";
import { Delete, Description, Post, Put } from "@tsed/schema";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { isFeatureEnabled } from "lib/cad";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
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
  async registerVehicle(
    @Context("user") user: User,
    @Context("cad") cad: cad & { miscCadSettings?: MiscCadSettings; features?: CadFeature[] },
    @BodyParams() body: unknown,
  ) {
    const data = validateSchema(VEHICLE_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    if (checkCitizenUserId) {
      canManageInvariant(citizen?.userId, user, new NotFound("notFound"));
    } else if (!citizen) {
      throw new NotFound("NotFound");
    }

    const existing = await prisma.registeredVehicle.findUnique({
      where: {
        plate: data.plate.toUpperCase(),
      },
    });

    if (existing) {
      throw new ExtendedBadRequest({ plate: "plateAlreadyInUse" });
    }

    const plateLength = cad.miscCadSettings?.maxPlateLength ?? 8;
    if (data.plate.length > plateLength) {
      throw new ExtendedBadRequest({ plate: "plateToLong" });
    }

    const isCustomEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.CUSTOM_TEXTFIELD_VALUES,
      defaultReturn: false,
    });

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

    const isDmvEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.DMV,
      defaultReturn: false,
    });

    const vehicle = await prisma.registeredVehicle.create({
      data: {
        plate: data.plate.toUpperCase(),
        color: data.color,
        citizenId: citizen.id,
        modelId,
        registrationStatusId: data.registrationStatus,
        vinNumber: data.vinNumber || generateString(17),
        userId: user.id || undefined,
        insuranceStatusId: data.insuranceStatus,
        taxStatus: data.taxStatus as VehicleTaxStatus | null,
        inspectionStatus: data.inspectionStatus as VehicleInspectionStatus | null,
        dmvStatus: isDmvEnabled ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED,
      },
      include: {
        model: { include: { value: true } },
        registrationStatus: true,
        citizen: Boolean(data.businessId && data.employeeId),
      },
    });

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
    @Context("cad") cad: { features?: CadFeature[]; miscCadSettings: MiscCadSettings },
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
      const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
      if (checkCitizenUserId) {
        canManageInvariant(vehicle?.userId, user, new NotFound("notFound"));
      } else if (!vehicle) {
        throw new NotFound("NotFound");
      }
    }

    const isDmvEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.DMV,
      defaultReturn: false,
    });

    const isCustomEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.CUSTOM_TEXTFIELD_VALUES,
      defaultReturn: false,
    });

    const dmvStatus = isDmvEnabled
      ? data.reApplyForDmv && vehicle.dmvStatus === WhitelistStatus.DECLINED
        ? WhitelistStatus.PENDING
        : undefined // undefined = will not update the database entry
      : null;

    let valueModel;
    if (isCustomEnabled) {
      valueModel = await prisma.vehicleValue.findFirst({
        where: {
          value: {
            value: { contains: data.model, mode: "insensitive" },
          },
        },
      });

      if (!valueModel) {
        await prisma.vehicleValue.create({
          data: {
            value: {
              create: {
                value: data.model,
                type: ValueType.VEHICLE,
                isDefault: false,
              },
            },
          },
        });
      }
    }

    const updated = await prisma.registeredVehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        modelId: isCustomEnabled ? valueModel?.id : data.model,
        color: data.color,
        registrationStatusId: data.registrationStatus,
        vinNumber: data.vinNumber || vehicle.vinNumber,
        reportedStolen: data.reportedStolen ?? false,
        insuranceStatusId: data.insuranceStatus,
        taxStatus: data.taxStatus as VehicleTaxStatus | null,
        inspectionStatus: data.inspectionStatus as VehicleInspectionStatus | null,
        dmvStatus,
      },
      include: {
        model: { include: { value: true } },
        registrationStatus: true,
      },
    });

    return updated;
  }

  @Post("/transfer/:vehicleId")
  @Description("Transfer a vehicle to a new owner")
  async transferVehicle(@BodyParams() body: unknown, @PathParams("vehicleId") vehicleId: string) {
    const data = validateSchema(TRANSFER_VEHICLE_SCHEMA, body);

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    const newOwner = await prisma.citizen.findFirst({
      where: {
        AND: [{ id: data.ownerId }, { NOT: { id: vehicle.citizenId } }],
      },
    });

    if (!newOwner) {
      throw new NotFound("newOwnerNotFound");
    }

    const updatedVehicle = await prisma.registeredVehicle.update({
      where: { id: vehicle.id },
      data: {
        citizenId: newOwner.id,
        userId: newOwner.userId,
      },
    });

    return updatedVehicle;
  }

  @Delete("/:id")
  @Description("Delete a registered vehicle")
  async deleteVehicle(
    @Context("user") user: User,
    @Context("cad") cad: { features?: CadFeature[] },
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
      const owner = await prisma.citizen.findUnique({
        where: { id: vehicle.citizenId },
      });

      // registered vehicles may not have `userId`
      // therefore we should use `citizen`
      const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
      if (checkCitizenUserId) {
        canManageInvariant(owner?.userId, user, new NotFound("notFound"));
      } else if (!owner) {
        throw new NotFound("NotFound");
      }
    }
    await prisma.registeredVehicle.delete({
      where: {
        id: vehicle.id,
      },
    });

    return true;
  }
}
