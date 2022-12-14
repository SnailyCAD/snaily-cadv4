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
  Prisma,
} from "@prisma/client";
import { VEHICLE_SCHEMA, DELETE_VEHICLE_SCHEMA, TRANSFER_VEHICLE_SCHEMA } from "@snailycad/schemas";
import { UseBeforeEach, Context, BodyParams, PathParams, QueryParams } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { isFeatureEnabled } from "lib/cad";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import { prisma } from "lib/prisma";
import { validateSchema } from "lib/validateSchema";
import { IsAuth } from "middlewares/IsAuth";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { generateString } from "utils/generateString";
import { citizenInclude } from "./CitizenController";
import type * as APITypes from "@snailycad/types/api";
import type { RegisteredVehicle } from "@snailycad/types";

@Controller("/vehicles")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class VehiclesController {
  private VIN_NUMBER_LENGTH = 17;

  @Get("/search")
  async searchCitizenVehicles(
    @Context("user") user: User,
    @QueryParams("query", String) query: string,
    @QueryParams("citizenId", String) citizenId?: string,
  ) {
    const where: Prisma.RegisteredVehicleWhereInput = {
      ...{ userId: user.id },
      ...(citizenId ? { citizenId } : {}),
      ...(query
        ? {
            OR: [
              { color: { contains: query, mode: "insensitive" } },
              { model: { value: { value: { contains: query, mode: "insensitive" } } } },
              { registrationStatus: { value: { contains: query, mode: "insensitive" } } },
              { vinNumber: { contains: query, mode: "insensitive" } },
              { plate: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const vehicles = await prisma.registeredVehicle.findMany({
      where,
      take: 30,
      include: citizenInclude.vehicles.include,
      orderBy: { createdAt: "desc" },
    });

    return vehicles;
  }

  @Get("/:citizenId")
  async getCitizenVehicles(
    @PathParams("citizenId") citizenId: string,
    @Context("user") user: User,
    @Context("cad") cad: cad,
    @QueryParams("skip", Number) skip = 0,
    @QueryParams("query", String) query?: string,
  ): Promise<APITypes.GetCitizenVehiclesData> {
    const checkCitizenUserId = shouldCheckCitizenUserId({ cad, user });
    const citizen = await prisma.citizen.findFirst({
      where: { id: citizenId, userId: checkCitizenUserId ? user.id : undefined },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const where: Prisma.RegisteredVehicleWhereInput = {
      ...{ citizenId },
      ...(query
        ? {
            OR: [
              { color: { contains: query, mode: "insensitive" } },
              { model: { value: { value: { contains: query, mode: "insensitive" } } } },
              { registrationStatus: { value: { contains: query, mode: "insensitive" } } },
              { vinNumber: { contains: query, mode: "insensitive" } },
              { plate: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [totalCount, vehicles] = await prisma.$transaction([
      prisma.registeredVehicle.count({ where }),
      prisma.registeredVehicle.findMany({
        where,
        take: 12,
        skip,
        include: citizenInclude.vehicles.include,
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return { totalCount, vehicles };
  }

  @Post("/")
  @Description("Register a new vehicle")
  async registerVehicle(
    @Context("user") user: User,
    @Context("cad") cad: cad & { miscCadSettings?: MiscCadSettings; features?: CadFeature[] },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostCitizenVehicleData> {
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

    const vehicleModel = await prisma.vehicleValue.findUnique({
      where: { id: modelId },
    });

    if (!vehicleModel) {
      throw new ExtendedBadRequest({
        model: "Invalid vehicle model. Please re-enter the vehicle model.",
      });
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
        vinNumber: await this.generateOrValidateVINNumber(data.vinNumber || null),
        userId: user.id || undefined,
        insuranceStatusId: data.insuranceStatus,
        taxStatus: data.taxStatus as VehicleTaxStatus | null,
        inspectionStatus: data.inspectionStatus as VehicleInspectionStatus | null,
        dmvStatus: isDmvEnabled ? WhitelistStatus.PENDING : WhitelistStatus.ACCEPTED,
        appearance: data.appearance ?? null,
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
  ): Promise<APITypes.PutCitizenVehicleData> {
    const data = validateSchema(VEHICLE_SCHEMA, body);

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle) {
      throw new NotFound("notFound");
    }

    if (vehicle.impounded) {
      throw new BadRequest("vehicleIsImpounded");
    }

    const existing = await prisma.registeredVehicle.findFirst({
      where: {
        AND: [{ plate: data.plate.toUpperCase() }, { plate: { not: vehicle.plate.toUpperCase() } }],
      },
    });

    if (existing) {
      throw new ExtendedBadRequest({ plate: "plateAlreadyInUse" });
    }

    const plateLength = cad.miscCadSettings.maxPlateLength || 8;
    if (data.plate.length > plateLength) {
      throw new ExtendedBadRequest({ plate: "plateToLong" });
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

    const updatedVehicle = await prisma.registeredVehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        plate: data.plate,
        modelId: isCustomEnabled ? valueModel?.id : data.model,
        color: data.color,
        registrationStatusId: data.registrationStatus,
        vinNumber: data.vinNumber
          ? await this.generateOrValidateVINNumber(data.vinNumber, vehicle)
          : undefined,
        reportedStolen: data.reportedStolen ?? false,
        insuranceStatusId: data.insuranceStatus,
        taxStatus: data.taxStatus as VehicleTaxStatus | null,
        inspectionStatus: data.inspectionStatus as VehicleInspectionStatus | null,
        dmvStatus,
        appearance: data.appearance ?? null,
      },
      include: {
        model: { include: { value: true } },
        registrationStatus: true,
      },
    });

    return updatedVehicle;
  }

  @Post("/transfer/:vehicleId")
  @Description("Transfer a vehicle to a new owner")
  async transferVehicle(
    @BodyParams() body: unknown,
    @PathParams("vehicleId") vehicleId: string,
  ): Promise<APITypes.PostCitizenTransferVehicleData> {
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
  ): Promise<APITypes.DeleteCitizenVehicleData> {
    const data = validateSchema(DELETE_VEHICLE_SCHEMA, body);

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle) {
      throw new NotFound("notFound");
    }

    if (vehicle.impounded) {
      throw new BadRequest("vehicleIsImpounded");
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

  private async generateOrValidateVINNumber(
    _vinNumber?: string | null,
    vehicle?: Pick<RegisteredVehicle, "id">,
  ): Promise<string> {
    const vinNumber = _vinNumber ?? generateString(this.VIN_NUMBER_LENGTH);

    const existing = await prisma.registeredVehicle.findFirst({
      where: {
        vinNumber: { mode: "insensitive", equals: vinNumber },
        NOT: vehicle ? { id: vehicle.id } : undefined,
      },
    });

    if (!existing) {
      return vinNumber;
    }

    if (_vinNumber) {
      throw new ExtendedBadRequest({ vinNumber: "vinNumberInUse" });
    }

    return this.generateOrValidateVINNumber(_vinNumber, vehicle);
  }
}
