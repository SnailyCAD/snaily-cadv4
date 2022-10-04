import { Controller } from "@tsed/di";
import {
  LICENSE_SCHEMA,
  LEO_VEHICLE_LICENSE_SCHEMA,
  CREATE_CITIZEN_SCHEMA,
  VEHICLE_SCHEMA,
  IMPOUND_VEHICLE_SCHEMA,
} from "@snailycad/schemas";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { updateCitizenLicenseCategories } from "lib/citizen/licenses";
import {
  cad,
  CadFeature,
  Feature,
  MiscCadSettings,
  ValueType,
  VehicleInspectionStatus,
  VehicleTaxStatus,
  WhitelistStatus,
  User,
  CustomFieldCategory,
  SuspendedCitizenLicenses,
} from "@prisma/client";
import { UseBeforeEach, Context } from "@tsed/common";
import { ContentType, Description, Post, Put } from "@tsed/schema";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { validateSchema } from "lib/validateSchema";
import { manyToManyHelper } from "utils/manyToMany";
import { validateCustomFields } from "lib/custom-fields";
import { isFeatureEnabled } from "lib/cad";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import {
  appendCustomFields,
  citizenSearchIncludeOrSelect,
  vehicleSearchInclude,
} from "./SearchController";
import { citizenObjectFromData } from "lib/citizen";
import { generateString } from "utils/generateString";
import type * as APITypes from "@snailycad/types/api";

@Controller("/search/actions")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class SearchActionsController {
  @Put("/licenses/:citizenId")
  @Description("Update the licenses for a citizen by their id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateCitizenLicenses(
    @BodyParams() body: unknown,
    @PathParams("citizenId") citizenId: string,
  ): Promise<APITypes.PutSearchActionsLicensesData> {
    const data = validateSchema(LICENSE_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
      include: { dlCategory: true, suspendedLicenses: true },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    await updateCitizenLicenseCategories(citizen, data);

    let suspendedLicenses: SuspendedCitizenLicenses | undefined;
    if (data.suspended) {
      const createUpdateData = {
        driverLicense: data.suspended.driverLicense,
        firearmsLicense: data.suspended.firearmsLicense,
        pilotLicense: data.suspended.pilotLicense,
        waterLicense: data.suspended.waterLicense,
      };

      suspendedLicenses = await prisma.suspendedCitizenLicenses.upsert({
        where: { id: String(citizen.suspendedLicensesId) },
        create: createUpdateData,
        update: createUpdateData,
      });
    }

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        driversLicenseId: data.driversLicense,
        pilotLicenseId: data.pilotLicense,
        weaponLicenseId: data.weaponLicense,
        waterLicenseId: data.waterLicense,
        suspendedLicensesId: suspendedLicenses?.id,
      },
      include: citizenInclude,
    });

    return updated;
  }

  @Put("/vehicle-licenses/:vehicleId")
  @Description("Update the licenses of a vehicle by its id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateVehicleLicenses(
    @BodyParams() body: unknown,
    @PathParams("vehicleId") vehicleId: string,
  ): Promise<APITypes.PutSearchActionsVehicleLicensesData> {
    const data = validateSchema(LEO_VEHICLE_LICENSE_SCHEMA, body);

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: {
        id: vehicleId,
      },
    });

    if (!vehicle) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.registeredVehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        registrationStatusId: data.registrationStatus,
        insuranceStatusId: data.insuranceStatus,
        taxStatus: data.taxStatus as VehicleTaxStatus | null,
        inspectionStatus: data.inspectionStatus as VehicleInspectionStatus | null,
      },
      include: vehicleSearchInclude,
    });

    return appendCustomFields(updated, CustomFieldCategory.VEHICLE);
  }

  @Put("/vehicle-flags/:vehicleId")
  @Description("Update the vehicle flags by its id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateVehicleFlags(
    @BodyParams("flags") flags: string[],
    @PathParams("vehicleId") vehicleId: string,
  ): Promise<APITypes.PutSearchActionsVehicleFlagsData> {
    const vehicle = await prisma.registeredVehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true, flags: true },
    });

    if (!vehicle) {
      throw new NotFound("notFound");
    }

    const disconnectConnectArr = manyToManyHelper(
      vehicle.flags.map((v) => v.id),
      flags,
    );

    await prisma.$transaction(
      disconnectConnectArr.map((v) =>
        prisma.registeredVehicle.update({ where: { id: vehicle.id }, data: { flags: v } }),
      ),
    );

    const updated = await prisma.registeredVehicle.findUniqueOrThrow({
      where: { id: vehicle.id },
      select: { id: true, flags: true },
    });

    return updated;
  }

  @Put("/citizen-flags/:citizenId")
  @Description("Update the citizens flags by their id")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateCitizenFlags(
    @BodyParams("flags") flags: string[],
    @PathParams("citizenId") citizenId: string,
  ): Promise<APITypes.PutSearchActionsCitizenFlagsData> {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: { id: true, flags: true },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const disconnectConnectArr = manyToManyHelper(
      citizen.flags.map((v) => v.id),
      flags,
    );

    await prisma.$transaction(
      disconnectConnectArr.map((v) =>
        prisma.citizen.update({ where: { id: citizen.id }, data: { flags: v } }),
      ),
    );

    const updated = await prisma.citizen.findUniqueOrThrow({
      where: { id: citizen.id },
      select: { id: true, flags: true },
    });

    return updated;
  }

  @Put("/custom-fields/citizen/:citizenId")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateCitizenCustomFields(
    @BodyParams("fields") fields: unknown,
    @PathParams("citizenId") citizenId: string,
  ): Promise<APITypes.PutSearchActionsUpdateCitizenCustomFields> {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: { id: true },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const createdFields = await validateCustomFields(fields);
    await prisma.$transaction(
      createdFields.map((field) =>
        prisma.citizen.update({
          where: { id: citizen.id },
          data: { customFields: { connect: { id: field.id } } },
        }),
      ),
    );

    return { id: citizen.id, customFields: createdFields };
  }

  @Put("/custom-fields/vehicle/:vehicleId")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateVehicleCustomFields(
    @BodyParams("fields") fields: unknown,
    @PathParams("vehicleId") vehicleId: string,
  ): Promise<APITypes.PutSearchActionsUpdateVehicleCustomFields> {
    const vehicle = await prisma.registeredVehicle.findUnique({
      where: { id: vehicleId },
      select: { id: true },
    });

    if (!vehicle) {
      throw new NotFound("notFound");
    }

    const createdFields = await validateCustomFields(fields);
    await prisma.$transaction(
      createdFields.map((field) =>
        prisma.registeredVehicle.update({
          where: { id: vehicle.id },
          data: { customFields: { connect: { id: field.id } } },
        }),
      ),
    );

    return { id: vehicle.id, customFields: createdFields };
  }

  @Put("/custom-fields/weapon/:weaponId")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async updateWeaponCustomFields(
    @BodyParams("fields") fields: unknown,
    @PathParams("weaponId") weaponId: string,
  ): Promise<APITypes.PutSearchActionsUpdateWeaponCustomFields> {
    const weapon = await prisma.weapon.findUnique({
      where: { id: weaponId },
      select: { id: true },
    });

    if (!weapon) {
      throw new NotFound("notFound");
    }

    const createdFields = await validateCustomFields(fields);
    await prisma.$transaction(
      createdFields.map((field) =>
        prisma.weapon.update({
          where: { id: weapon.id },
          data: { customFields: { connect: { id: field.id } } },
        }),
      ),
    );

    return { id: weapon.id, customFields: createdFields };
  }

  @Post("/citizen")
  @UsePermissions({
    fallback: (u) => u.isLeo,
    permissions: [Permissions.Leo],
  })
  async createCitizen(
    @Context("cad") cad: cad & { features?: CadFeature[]; miscCadSettings: MiscCadSettings | null },
    @Context("user") user: User,
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostSearchActionsCreateCitizen> {
    const isCreateCitizensEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.CREATE_USER_CITIZEN_LEO,
      defaultReturn: false,
    });

    if (!isCreateCitizensEnabled) {
      throw new BadRequest("featureNotEnabled");
    }

    const data = validateSchema(CREATE_CITIZEN_SCHEMA, body);

    const allowDuplicateCitizenNames = isFeatureEnabled({
      features: cad.features,
      feature: Feature.ALLOW_DUPLICATE_CITIZEN_NAMES,
      defaultReturn: true,
    });

    if (!allowDuplicateCitizenNames) {
      const existing = await prisma.citizen.findFirst({
        where: {
          name: data.name,
          surname: data.surname,
        },
      });

      if (existing) {
        throw new ExtendedBadRequest({ name: "nameAlreadyTaken" });
      }
    }

    const date = new Date(data.dateOfBirth).getTime();
    const now = Date.now();

    if (date > now) {
      throw new ExtendedBadRequest({ dateOfBirth: "dateLargerThanNow" });
    }

    const defaultLicenseValue = await prisma.value.findFirst({
      where: { isDefault: true, type: ValueType.LICENSE },
    });
    const defaultLicenseValueId = defaultLicenseValue?.id ?? null;

    const citizen = await prisma.citizen.create({
      data: citizenObjectFromData(data, defaultLicenseValueId),
      ...citizenSearchIncludeOrSelect(user, cad),
    });

    return citizen as APITypes.PostSearchActionsCreateCitizen;
  }

  @Post("/impound/:vehicleId")
  @Description("Impound a vehicle from plate search")
  async impoundVehicle(
    @BodyParams() body: unknown,
    @PathParams("vehicleId") vehicleId: string,
  ): Promise<APITypes.PostSearchActionsCreateVehicle> {
    const data = validateSchema(IMPOUND_VEHICLE_SCHEMA, body);

    const vehicle = await prisma.registeredVehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFound("NotFound");
    }

    if (vehicle.impounded) {
      throw new BadRequest("vehicleAlreadyImpounded");
    }

    await prisma.impoundedVehicle.create({
      data: {
        valueId: data.impoundLot,
        registeredVehicleId: vehicle.id,
      },
    });

    const impoundedVehicle = await prisma.registeredVehicle.update({
      where: {
        id: vehicle.id,
      },
      data: {
        impounded: true,
      },
      include: vehicleSearchInclude,
    });

    return appendCustomFields(impoundedVehicle, CustomFieldCategory.VEHICLE);
  }

  @Post("/vehicle")
  @Description("Register a new vehicle to a citizen as LEO")
  async registerVehicle(
    @Context("user") user: User,
    @Context("cad") cad: cad & { miscCadSettings?: MiscCadSettings; features?: CadFeature[] },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostSearchActionsCreateVehicle> {
    const data = validateSchema(VEHICLE_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: data.citizenId,
      },
    });

    if (!citizen) {
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
      include: vehicleSearchInclude,
    });

    return appendCustomFields(vehicle, CustomFieldCategory.VEHICLE);
  }
}
