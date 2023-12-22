import { Controller } from "@tsed/di";
import {
  LICENSE_SCHEMA,
  LEO_VEHICLE_LICENSE_SCHEMA,
  CREATE_CITIZEN_SCHEMA,
  IMPOUND_VEHICLE_SCHEMA,
  LEO_VEHICLE_SCHEMA,
  LICENSE_POINTS_SCHEMA,
} from "@snailycad/schemas";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { updateCitizenLicenseCategories } from "lib/citizen/licenses/update-citizen-license-categories";
import {
  type cad,
  Feature,
  type MiscCadSettings,
  ValueType,
  type VehicleInspectionStatus,
  type VehicleTaxStatus,
  WhitelistStatus,
  type User,
  CustomFieldCategory,
  type SuspendedCitizenLicenses,
  DiscordWebhookType,
  type Officer,
  type CombinedLeoUnit,
} from "@prisma/client";
import { UseBeforeEach, Context, UseBefore } from "@tsed/common";
import { ContentType, Description, Post, Put } from "@tsed/schema";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { validateSchema } from "lib/data/validate-schema";
import { manyToManyHelper } from "lib/data/many-to-many";
import { validateCustomFields } from "lib/validate-custom-fields";
import { isFeatureEnabled } from "lib/upsert-cad";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import {
  appendCustomFields,
  citizenSearchIncludeOrSelect,
  vehicleSearchInclude,
} from "./SearchController";
import { citizenObjectFromData } from "lib/citizen/citizen-create-data-obj";
import { generateString } from "utils/generate-string";
import type * as APITypes from "@snailycad/types/api";
import { createVehicleImpoundedWebhookData } from "controllers/calls/tow-controller";
import { sendDiscordWebhook, sendRawWebhook } from "lib/discord/webhooks";
import { getUserOfficerFromActiveOfficer } from "lib/leo/utils";
import { ActiveOfficer } from "middlewares/active-officer";
import { IsFeatureEnabled } from "~/middlewares/is-enabled";
import { validateSocialSecurityNumber } from "~/lib/citizen/validate-ssn";

@Controller("/search/actions")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class SearchActionsController {
  @Put("/licenses/:citizenId")
  @Description("Update the licenses for a citizen by their id")
  @UsePermissions({
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
        driverLicenseTimeEnd: data.suspended.driverLicenseTimeEnd,
        firearmsLicense: data.suspended.firearmsLicense,
        firearmsLicenseTimeEnd: data.suspended.firearmsLicenseTimeEnd,
        pilotLicense: data.suspended.pilotLicense,
        pilotLicenseTimeEnd: data.suspended.pilotLicenseTimeEnd,
        waterLicense: data.suspended.waterLicense,
        waterLicenseTimeEnd: data.suspended.waterLicenseTimeEnd,
        fishingLicense: data.suspended.fishingLicense,
        fishingLicenseTimeEnd: data.suspended.fishingLicenseTimeEnd,
        huntingLicense: data.suspended.huntingLicense,
        huntingLicenseTimeEnd: data.suspended.huntingLicenseTimeEnd,
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
        huntingLicenseId: data.huntingLicense,
        fishingLicenseId: data.fishingLicense,
        waterLicenseId: data.waterLicense,
        suspendedLicensesId: suspendedLicenses?.id,
      },
      include: citizenInclude,
    });

    return updated;
  }

  @Put("/license-points/:citizenId")
  @Description("Update the license points for a citizen by their id")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async updateCitizenLicensePoints(
    @BodyParams() body: unknown,
    @PathParams("citizenId") citizenId: string,
  ): Promise<APITypes.PutSearchActionsLicensePointsData> {
    const data = validateSchema(LICENSE_POINTS_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const createUpdateData = {
      driverLicensePoints: data.driverLicensePoints,
      pilotLicensePoints: data.pilotLicensePoints,
      waterLicensePoints: data.waterLicensePoints,
      firearmsLicensePoints: data.firearmsLicensePoints,
      huntingLicensePoints: data.huntingLicensePoints,
      fishingLicensePoints: data.fishingLicensePoints,
    };

    const updated = await prisma.citizen.update({
      where: { id: citizen.id },
      data: {
        licensePoints: { upsert: { create: createUpdateData, update: createUpdateData } },
      },
      include: citizenInclude,
    });

    return updated;
  }

  @Put("/vehicle-licenses/:vehicleId")
  @Description("Update the licenses of a vehicle by its id")
  @UsePermissions({
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
      { showUpsert: false },
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
      { showUpsert: false },
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

  @Put("/citizen-address-flags/:citizenId")
  @Description("Update the citizen's address flags by their id")
  @UsePermissions({
    permissions: [Permissions.Dispatch],
  })
  async updateCitizenAddressFlags(
    @BodyParams("addressFlags") addressFlags: string[],
    @PathParams("citizenId") citizenId: string,
  ): Promise<APITypes.PutSearchActionsCitizenFlagsData> {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: { id: true, addressFlags: true },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const disconnectConnectArr = manyToManyHelper(
      citizen.addressFlags.map((v) => v.id),
      addressFlags,
      { showUpsert: false },
    );

    await prisma.$transaction(
      disconnectConnectArr.map((v) =>
        prisma.citizen.update({ where: { id: citizen.id }, data: { addressFlags: v } }),
      ),
    );

    const updated = await prisma.citizen.findUniqueOrThrow({
      where: { id: citizen.id },
      select: { id: true, addressFlags: true },
    });

    return updated;
  }

  @Put("/custom-fields/citizen/:citizenId")
  @UsePermissions({
    permissions: [Permissions.LeoManageCustomFields],
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
    permissions: [Permissions.LeoManageCustomFields],
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
    permissions: [Permissions.LeoManageCustomFields],
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
    permissions: [Permissions.Leo],
  })
  async createCitizen(
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings | null },
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
        throw new ExtendedBadRequest({ name: "nameAlreadyTaken" }, "nameAlreadyTaken");
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
      data: await citizenObjectFromData({
        data,
        defaultLicenseValueId,
        cad,
      }),
      ...citizenSearchIncludeOrSelect(user, cad),
    });

    return citizen as APITypes.PostSearchActionsCreateCitizen;
  }

  @Put("/citizen/:id")
  @UsePermissions({
    permissions: [Permissions.LeoManageCitizenProfile],
  })
  @IsFeatureEnabled({ feature: Feature.LEO_EDITABLE_CITIZEN_PROFILE })
  async updateCitizenById(
    @Context("cad")
    cad: cad & { features?: Record<Feature, boolean>; miscCadSettings: MiscCadSettings | null },
    @Context("user") user: User,
    @BodyParams() body: unknown,
    @PathParams("id") citizenId: string,
  ): Promise<APITypes.PostSearchActionsCreateCitizen> {
    const data = validateSchema(CREATE_CITIZEN_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    const date = data.dateOfBirth ? new Date(data.dateOfBirth).getTime() : undefined;
    if (date) {
      const now = Date.now();

      if (date > now) {
        throw new ExtendedBadRequest({ dateOfBirth: "dateLargerThanNow" });
      }
    }

    const isEditableSSNEnabled = isFeatureEnabled({
      features: cad.features,
      feature: Feature.EDITABLE_SSN,
      defaultReturn: true,
    });

    if (data.socialSecurityNumber && isEditableSSNEnabled) {
      await validateSocialSecurityNumber({
        socialSecurityNumber: data.socialSecurityNumber,
        citizenId: citizen.id,
      });
    }

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        ...(await citizenObjectFromData({
          data,
          cad,
        })),
        socialSecurityNumber:
          data.socialSecurityNumber && isEditableSSNEnabled
            ? data.socialSecurityNumber
            : !citizen.socialSecurityNumber
              ? generateString(9, { type: "numbers-only" })
              : undefined,
      },
      ...citizenSearchIncludeOrSelect(user, cad),
    });

    return updated as APITypes.PostSearchActionsCreateCitizen;
  }

  @UseBefore(ActiveOfficer)
  @Post("/impound/:vehicleId")
  @Description("Impound a vehicle from plate search")
  async impoundVehicle(
    @BodyParams() body: unknown,
    @PathParams("vehicleId") vehicleId: string,
    @Context("activeOfficer") activeOfficer: (CombinedLeoUnit & { officers: Officer[] }) | Officer,
    @Context("user") user: User,
  ): Promise<APITypes.PostSearchActionsCreateVehicle> {
    const data = validateSchema(IMPOUND_VEHICLE_SCHEMA, body);
    const officer = getUserOfficerFromActiveOfficer({
      userId: user.id,
      allowDispatch: true,
      activeOfficer,
    });

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
        officerId: officer?.id ?? null,
        descriptionData: data.descriptionData,
      },
    });

    const impoundedVehicle = await prisma.registeredVehicle.update({
      where: { id: vehicle.id },
      data: { impounded: true },
      include: vehicleSearchInclude,
    });

    try {
      const data = await createVehicleImpoundedWebhookData(impoundedVehicle, user.locale);
      await sendDiscordWebhook({ type: DiscordWebhookType.VEHICLE_IMPOUNDED, data });
      await sendRawWebhook({ type: DiscordWebhookType.VEHICLE_IMPOUNDED, data: impoundedVehicle });
    } catch (error) {
      console.error("Could not send Discord webhook.", error);
    }

    return appendCustomFields(impoundedVehicle, CustomFieldCategory.VEHICLE);
  }

  @Post("/vehicle")
  @Description("Register a new vehicle to a citizen as LEO")
  async registerVehicle(
    @Context("user") user: User,
    @Context("cad")
    cad: cad & { miscCadSettings?: MiscCadSettings; features?: Record<Feature, boolean> },
    @BodyParams() body: unknown,
  ): Promise<APITypes.PostSearchActionsCreateVehicle> {
    const data = validateSchema(LEO_VEHICLE_SCHEMA, body);

    if (data.citizenId) {
      const citizen = await prisma.citizen.findUnique({
        where: {
          id: data.citizenId,
        },
      });

      if (!citizen) {
        throw new NotFound("NotFound");
      }
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
        citizenId: data.citizenId || null,
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

  @Post("/missing/:citizenId")
  @UsePermissions({
    permissions: [Permissions.EmsFd, Permissions.Leo, Permissions.Dispatch],
  })
  async declareCitizenMissing(
    @PathParams("citizenId") citizenId: string,
  ): Promise<APITypes.PostLEODeclareCitizenMissing> {
    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        missing: !citizen.missing,
        dateOfMissing: citizen.missing ? null : new Date(),
      },
    });

    return updated;
  }

  @Put("/weapon-flags/:weaponId")
  @Description("Update the weapon's flags by their id")
  @UsePermissions({
    permissions: [Permissions.Leo],
  })
  async updateWeaponFlags(
    @BodyParams("flags") flags: string[],
    @PathParams("weaponId") weaponId: string,
  ): Promise<APITypes.PutSearchActionsWeaponFlagsData> {
    const weapon = await prisma.weapon.findUnique({
      where: { id: weaponId },
      select: { id: true, flags: true },
    });

    if (!weapon) {
      throw new NotFound("notFound");
    }

    const disconnectConnectArr = manyToManyHelper(
      weapon.flags.map((v) => v.id),
      flags,
      { showUpsert: false },
    );

    await prisma.$transaction(
      disconnectConnectArr.map((v) =>
        prisma.weapon.update({ where: { id: weapon.id }, data: { flags: v } }),
      ),
    );

    const updated = await prisma.weapon.findUniqueOrThrow({
      where: { id: weapon.id },
      select: { id: true, flags: true },
    });

    return updated;
  }
}
