import { Controller } from "@tsed/di";
import {
  LICENSE_SCHEMA,
  LEO_VEHICLE_LICENSE_SCHEMA,
  CREATE_CITIZEN_SCHEMA,
  VEHICLE_SCHEMA,
} from "@snailycad/schemas";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { NotFound } from "@tsed/exceptions";
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
} from "@prisma/client";
import { UseBeforeEach, Context } from "@tsed/common";
import { Description, Post, Put } from "@tsed/schema";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { validateSchema } from "lib/validateSchema";
import { manyToManyHelper } from "utils/manyToMany";
import { validateCustomFields } from "lib/custom-fields";
import { isFeatureEnabled } from "lib/cad";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";
import { citizenSearchInclude, vehicleSearchInclude } from "./SearchController";
import { citizenObjectFromData } from "lib/citizen";
import { generateString } from "utils/generateString";
import type { User } from "@snailycad/types";

@Controller("/search/actions")
@UseBeforeEach(IsAuth)
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
  ) {
    const data = validateSchema(LICENSE_SCHEMA, body);

    const citizen = await prisma.citizen.findUnique({
      where: {
        id: citizenId,
      },
      include: { dlCategory: true },
    });

    if (!citizen) {
      throw new NotFound("notFound");
    }

    await updateCitizenLicenseCategories(citizen, data);

    const updated = await prisma.citizen.update({
      where: {
        id: citizen.id,
      },
      data: {
        driversLicenseId: data.driversLicense,
        pilotLicenseId: data.pilotLicense,
        weaponLicenseId: data.weaponLicense,
        waterLicenseId: data.waterLicense,
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
  ) {
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
      include: {
        registrationStatus: true,
        insuranceStatus: true,
      },
    });

    return updated;
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
  ) {
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

    const updated = await prisma.registeredVehicle.findUnique({
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
  ) {
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

    const updated = await prisma.citizen.findUnique({
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
  ) {
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
  ) {
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
  ) {
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
    @BodyParams() body: unknown,
  ) {
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
      include: citizenSearchInclude(cad),
    });

    return citizen;
  }

  @Post("/vehicle")
  @Description("Register a new vehicle to a citizen as LEO")
  async registerVehicle(@Context() ctx: Context, @BodyParams() body: unknown) {
    const data = validateSchema(VEHICLE_SCHEMA, body);
    const user = ctx.get("user") as User;
    const cad = ctx.get("cad") as {
      features: CadFeature[];
      miscCadSettings?: MiscCadSettings;
    };

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

    return vehicle;
  }
}
