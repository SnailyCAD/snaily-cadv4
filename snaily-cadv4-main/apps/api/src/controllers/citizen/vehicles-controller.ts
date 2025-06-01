import {
  type MiscCadSettings,
  type User,
  Feature,
  type VehicleInspectionStatus,
  type VehicleTaxStatus,
  WhitelistStatus,
  ValueType,
  type cad,
  type Prisma,
  type Value,
  EmployeeAsEnum,
} from "@prisma/client";
import { VEHICLE_SCHEMA, DELETE_VEHICLE_SCHEMA, TRANSFER_VEHICLE_SCHEMA } from "@snailycad/schemas";
import {
  UseBeforeEach,
  Context,
  BodyParams,
  PathParams,
  QueryParams,
  MultipartFile,
  type PlatformMulterFile,
} from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { ContentType, Delete, Description, Get, Post, Put } from "@tsed/schema";
import { canManageInvariant } from "lib/auth/getSessionUser";
import { isFeatureEnabled } from "lib/upsert-cad";
import { shouldCheckCitizenUserId } from "lib/citizen/has-citizen-access";
import { prisma } from "lib/data/prisma";
import { validateSchema } from "lib/data/validate-schema";
import { IsAuth } from "middlewares/auth/is-auth";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { generateString } from "utils/generate-string";
import { citizenInclude } from "./CitizenController";
import type * as APITypes from "@snailycad/types/api";
import type { RegisteredVehicle } from "@snailycad/types";
import { getLastOfArray, manyToManyHelper } from "lib/data/many-to-many";
import { type AllowedFileExtension, allowedFileExtensions } from "@snailycad/config";
import { getImageWebPPath } from "~/lib/images/get-image-webp-path";
import fs from "node:fs/promises";
import { ExtendedNotFound } from "~/exceptions/extended-not-found";

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
    @Context("cad") cad: { features: Record<Feature, boolean> },
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
    @Context("cad")
    cad: cad & { miscCadSettings?: MiscCadSettings; features?: Record<Feature, boolean> },
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

    const isPlateBlacklisted = await prisma.blacklistedWord.findFirst({
      where: {
        word: { contains: data.plate, mode: "insensitive" },
      },
    });
    if (isPlateBlacklisted) {
      throw new ExtendedBadRequest({ plate: "blacklistedWordUsed" });
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

    const isEditableVINEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.EDITABLE_VIN,
      defaultReturn: true,
    });

    const vinNumber = await this.generateOrValidateVINNumber({
      vinNumber: data.vinNumber || null,
      isEditableVINEnabled,
    });

    const vehicle = await prisma.registeredVehicle.create({
      data: {
        plate: data.plate.toUpperCase(),
        color: data.color,
        citizenId: citizen.id,
        modelId,
        registrationStatusId: data.registrationStatus,
        vinNumber,
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
        trimLevels: true,
      },
    });

    const updatedVehicle = getLastOfArray(
      await prisma.$transaction(
        data.trimLevels?.map((trimLevel, idx) => {
          const includes = idx === 0 ? { trimLevels: true } : undefined;

          return prisma.registeredVehicle.update({
            where: { id: vehicle.id },
            data: {
              trimLevels: {
                connect: { id: trimLevel },
              },
            },
            include: includes,
          });
        }) ?? [],
      ),
    );

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

      const isOwner = employee?.role?.as === EmployeeAsEnum.OWNER;
      const canManageEmployees = isOwner ? true : employee?.canManageEmployees;

      if (!canManageEmployees) {
        throw new NotFound("employeeNotFoundOrInvalidPermissions");
      }

      await prisma.registeredVehicle.update({
        where: { id: vehicle.id },
        data: { Business: { connect: { id: data.businessId } } },
      });
    }

    return {
      ...vehicle,
      trimLevels: (updatedVehicle as unknown as { trimLevels?: Value[] } | null)?.trimLevels ?? [],
    };
  }

  @Put("/:id")
  @Description("Update a registered vehicle")
  async updateVehicle(
    @Context("user") user: User,
    @Context("cad") cad: { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings },
    @PathParams("id") vehicleId: string,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PutCitizenVehicleData> {
    const data = validateSchema(VEHICLE_SCHEMA, body);

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: {
        id: vehicleId,
      },
      include: {
        trimLevels: true,
      },
    });

    if (!vehicle) {
      throw new NotFound("notFound");
    }

    if (vehicle.impounded) {
      throw new BadRequest("vehicleIsImpounded");
    }

    const isPlateBlacklisted = await prisma.blacklistedWord.findFirst({
      where: {
        word: { contains: data.plate, mode: "insensitive" },
      },
    });
    if (isPlateBlacklisted) {
      throw new ExtendedBadRequest({ plate: "blacklistedWordUsed" });
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

      const isOwner = employee?.role?.as === "OWNER";
      if (!employee || !isOwner || employee.canManageVehicles) {
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

    if (data.trimLevels) {
      const connectDisconnectArr = manyToManyHelper(
        vehicle.trimLevels.map((v) => v.id),
        data.trimLevels,
        { showUpsert: false },
      );

      await prisma.$transaction(
        connectDisconnectArr.map((item) =>
          prisma.registeredVehicle.update({
            where: { id: vehicle.id },
            data: { trimLevels: item },
          }),
        ),
      );
    }

    const isEditableVINEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.EDITABLE_VIN,
      defaultReturn: true,
    });

    const vinNumber = await this.generateOrValidateVINNumber({
      vehicle,
      vinNumber: data.vinNumber,
      isEditableVINEnabled,
    });

    const updatedVehicle = await prisma.registeredVehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        plate: data.plate,
        modelId: isCustomEnabled ? valueModel?.id : data.model,
        color: data.color,
        registrationStatusId: data.registrationStatus,
        vinNumber,
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

    if (data.businessId) {
      const business = await prisma.business.findUnique({
        where: { id: data.businessId },
      });

      if (!business) {
        throw new ExtendedNotFound({ business: "businessNotFound" });
      }

      const updatedVehicle = await prisma.registeredVehicle.update({
        where: { id: vehicle.id },
        data: {
          citizen: vehicle.citizenId ? { disconnect: { id: vehicle.citizenId } } : undefined,
          Business: { connect: { id: data.businessId } },
        },
      });

      return updatedVehicle;
    }

    if (data.ownerId) {
      const newOwner = await prisma.citizen.findFirst({
        where: {
          AND: [{ id: data.ownerId }, { NOT: { id: String(vehicle.citizenId) } }],
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

    throw new ExtendedBadRequest({
      ownerId: "ownerIdOrBusinessIdRequired",
      businessId: "ownerIdOrBusinessIdRequired",
    });
  }

  @Delete("/:id")
  @Description("Delete a registered vehicle")
  async deleteVehicle(
    @Context("user") user: User,
    @Context("cad") cad: { features?: Record<Feature, boolean> },
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

      const isOwner = employee?.role?.as === "OWNER";
      if (!employee || !isOwner || !employee.canManageVehicles) {
        throw new NotFound("employeeNotFoundOrInvalidPermissions");
      }
    } else {
      if (vehicle.citizenId) {
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
    }

    await prisma.registeredVehicle.delete({
      where: {
        id: vehicle.id,
      },
    });

    return true;
  }

  @Post("/:id")
  async uploadImageToVehicle(
    @Context("user") user: User,
    @PathParams("id") vehicleId: string,
    @MultipartFile("image") file?: PlatformMulterFile,
  ): Promise<APITypes.PostCitizenImageByIdData> {
    try {
      const vehicle = await prisma.registeredVehicle.findUnique({
        where: {
          id: vehicleId,
          userId: user.id,
        },
      });

      if (!vehicle) {
        throw new NotFound("vehicleNotFound");
      }

      if (!file) {
        throw new ExtendedBadRequest({ file: "No file provided." }, "invalidImageType");
      }

      if (!allowedFileExtensions.includes(file.mimetype as AllowedFileExtension)) {
        throw new ExtendedBadRequest({ image: "invalidImageType" }, "invalidImageType");
      }

      const image = await getImageWebPPath({
        buffer: file.buffer,
        pathType: "values",
        id: `${vehicle.id}-${file.originalname.split(".")[0]}`,
      });

      const previousImage = vehicle.imageId
        ? `${process.cwd()}/public/values/${vehicle.imageId}`
        : undefined;

      if (previousImage) {
        await fs.rm(previousImage, { force: true });
      }

      const [data] = await Promise.all([
        prisma.registeredVehicle.update({
          where: { id: vehicle.id },
          data: { imageId: image.fileName },
          select: { imageId: true },
        }),
        fs.writeFile(image.path, image.buffer),
      ]);

      return data;
    } catch {
      throw new BadRequest("errorUploadingImage");
    }
  }

  private async generateOrValidateVINNumber(options: {
    isEditableVINEnabled: boolean;
    vinNumber?: string | null;
    vehicle?: Pick<RegisteredVehicle, "id">;
  }): Promise<string> {
    if (options.vehicle && !options.isEditableVINEnabled) {
      return undefined as unknown as string;
    }

    const vinNumber = options.vinNumber
      ? options.isEditableVINEnabled
        ? options.vinNumber
        : undefined
      : generateString(this.VIN_NUMBER_LENGTH);

    const existing = await prisma.registeredVehicle.findFirst({
      where: {
        vinNumber: { mode: "insensitive", equals: vinNumber },
        NOT: options.vehicle ? { id: options.vehicle.id } : undefined,
      },
    });

    if (!existing) {
      return vinNumber as string;
    }

    if (options.vinNumber) {
      throw new ExtendedBadRequest({ vinNumber: "vinNumberInUse" });
    }

    return this.generateOrValidateVINNumber(options);
  }
}
