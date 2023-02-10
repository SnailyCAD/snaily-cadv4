import { Controller, UseBeforeEach, Context } from "@tsed/common";
import { ContentType, Description, Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, QueryParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { leoProperties } from "lib/leo/activeOfficer";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import {
  cad,
  Citizen,
  CustomFieldCategory,
  DepartmentValue,
  Feature,
  Officer,
  WhitelistStatus,
  User,
} from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { CUSTOM_FIELD_SEARCH_SCHEMA } from "@snailycad/schemas";
import { isFeatureEnabled } from "lib/cad";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { shouldCheckCitizenUserId } from "lib/citizen/hasCitizenAccess";
import type * as APITypes from "@snailycad/types/api";
import { ExtendedBadRequest } from "src/exceptions/extended-bad-request";
import { setEndedSuspendedLicenses } from "lib/citizen/setEndedSuspendedLicenses";

export const vehicleSearchInclude = {
  model: { include: { value: true } },
  registrationStatus: true,
  insuranceStatus: true,
  TruckLog: true,
  Business: true,
  citizen: { include: { warrants: true } },
  flags: true,
  customFields: { include: { field: true } },
  notes: true,
};

export const citizenSearchIncludeOrSelect = (
  user: User,
  cad: cad & { features?: Record<Feature, boolean> },
) => {
  const isEnabled = isFeatureEnabled({
    feature: Feature.CITIZEN_RECORD_APPROVAL,
    features: cad.features,
    defaultReturn: false,
  });

  const hasPerms = hasPermission({
    userToCheck: user,
    permissionsToCheck: [
      ...defaultPermissions.defaultLeoPermissions,
      ...defaultPermissions.defaultDispatchPermissions,
      ...defaultPermissions.defaultEmsFdPermissions,
    ],
    fallback: (user) => user.isLeo || user.isDispatch || user.isEmsFd,
  });

  if (hasPerms) {
    return {
      include: {
        officers: { select: { department: { select: { isConfidential: true } } } },
        ...citizenInclude,
        vehicles: { include: vehicleSearchInclude },
        addressFlags: true,
        businesses: true,
        medicalRecords: true,
        customFields: { include: { field: true } },
        warrants: { include: { officer: { include: leoProperties } } },
        notes: true,
        Record: {
          where: isEnabled ? { status: WhitelistStatus.ACCEPTED } : undefined,
          include: {
            officer: {
              include: leoProperties,
            },
            seizedItems: true,
            courtEntry: { include: { dates: true } },
            vehicle: { include: { model: { include: { value: true } } } },
            violations: {
              include: {
                penalCode: {
                  include: {
                    warningApplicable: true,
                    warningNotApplicable: true,
                  },
                },
              },
            },
          },
        },
        dlCategory: { include: { value: true } },
      },
    } as any;
  }

  return {
    select: {
      name: true,
      surname: true,
      imageId: true,
      imageBlurData: true,
      officers: { select: { department: { select: { isConfidential: true } } } },
      id: true,
      socialSecurityNumber: true,
    },
  } as const;
};

const weaponsInclude = {
  citizen: true,
  model: { include: { value: true } },
  registrationStatus: true,
  customFields: { include: { field: true } },
};

@Controller("/search")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class LeoSearchController {
  @Post("/name")
  @Description("Search citizens by their name, surname or fullname. Returns the first 35 results.")
  async searchName(
    @BodyParams("name") fullName: string,
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
    @Context("user") user: User,
    @BodyParams("id") citizenId?: string,
    @QueryParams("fromAuthUserOnly", Boolean) fromAuthUserOnly = false,
  ): Promise<APITypes.PostLeoSearchCitizenData> {
    if (!fullName && !citizenId) {
      throw new ExtendedBadRequest({ name: "Must provide a name (first, last or fullname)." });
    }

    const [name, surname] = fullName.toString().toLowerCase().split(/ +/g);

    if ((!name || name.length < 2) && !surname) {
      return [];
    }

    if (citizenId) {
      const citizens = await prisma.citizen.findMany({
        where: { id: citizenId },
        take: 35,
        ...citizenSearchIncludeOrSelect(user, cad),
      });

      return appendConfidential(
        await appendCustomFields(citizens, CustomFieldCategory.CITIZEN),
      ) as APITypes.PostLeoSearchCitizenData;
    }

    const checkUserId = shouldCheckCitizenUserId({ cad, user });
    const citizens = await prisma.citizen.findMany({
      where: {
        userId: fromAuthUserOnly && checkUserId ? user.id : undefined,
        OR: [
          {
            name: { contains: name, mode: "insensitive" },
            surname: { contains: surname, mode: "insensitive" },
          },
          {
            name: { contains: surname, mode: "insensitive" },
            surname: { contains: name, mode: "insensitive" },
          },
          { driversLicenseNumber: { contains: name, mode: "insensitive" } },
          { weaponLicenseNumber: { contains: name, mode: "insensitive" } },
          { waterLicenseNumber: { contains: name, mode: "insensitive" } },
          { pilotLicenseNumber: { contains: name, mode: "insensitive" } },
          { socialSecurityNumber: name },
        ],
      },
      take: 35,
      ...citizenSearchIncludeOrSelect(user, cad),
    });

    return appendConfidential(
      await appendCustomFields(setEndedSuspendedLicenses(citizens), CustomFieldCategory.CITIZEN),
    ) as APITypes.PostLeoSearchCitizenData;
  }

  @Post("/weapon")
  @Description("Search weapons by their serialNumber")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch,
    permissions: [Permissions.Leo, Permissions.Dispatch],
  })
  async searchWeapon(
    @BodyParams("serialNumber") serialNumber: string,
    @QueryParams("includeMany", Boolean) includeMany = false,
  ): Promise<APITypes.PostLeoSearchWeaponData> {
    if (!serialNumber || serialNumber.length < 3) {
      return null;
    }

    const data = {
      where: {
        serialNumber: {
          startsWith: serialNumber,
          mode: "insensitive",
        },
      },
      include: weaponsInclude,
    } as const;

    if (includeMany) {
      const weapons = await prisma.weapon.findMany(data);
      return appendCustomFields(weapons, CustomFieldCategory.WEAPON);
    }

    const weapon = await prisma.weapon.findFirst(data);

    if (!weapon) {
      throw new NotFound("weaponNotFound");
    }

    return appendCustomFields(weapon, CustomFieldCategory.WEAPON);
  }

  @Post("/vehicle")
  @Description("Search vehicles by their plate or vinNumber")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch,
    permissions: [Permissions.Leo, Permissions.Dispatch],
  })
  async searchVehicle(
    @BodyParams("plateOrVin", String) plateOrVin: string,
    @QueryParams("includeMany", Boolean) includeMany: boolean,
  ): Promise<APITypes.PostLeoSearchVehicleData> {
    if (!plateOrVin || plateOrVin.length < 3) {
      return null;
    }

    const data = {
      where: {
        OR: [
          { plate: { startsWith: plateOrVin.toUpperCase() } },
          { vinNumber: { startsWith: plateOrVin.toUpperCase() } },
        ],
      },
      include: vehicleSearchInclude,
    };

    if (includeMany) {
      const vehicles = await prisma.registeredVehicle.findMany(data);

      return appendCustomFields(vehicles, CustomFieldCategory.VEHICLE);
    }

    const vehicle = await prisma.registeredVehicle.findFirst(data);

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    return appendCustomFields(vehicle, CustomFieldCategory.VEHICLE);
  }

  @Post("/custom-field")
  @Description("Search a citizen, vehicle or weapon via a custom field")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch,
    permissions: [Permissions.Leo, Permissions.Dispatch],
  })
  async customFieldSearch(
    @BodyParams() body: unknown,
    @Context("cad") cad: cad & { features?: Record<Feature, boolean> },
    @Context("user") user: User,
  ): Promise<APITypes.PostSearchCustomFieldData<true>> {
    const data = validateSchema(CUSTOM_FIELD_SEARCH_SCHEMA, body);

    const customField = await prisma.customField.findUnique({
      where: { id: data.customFieldId },
    });

    const _results = await prisma.customFieldValue.findMany({
      where: { fieldId: data.customFieldId, value: { mode: "insensitive", equals: data.query } },
      include: {
        Citizens: citizenSearchIncludeOrSelect(user, cad),
        RegisteredVehicles: { include: vehicleSearchInclude },
        Weapons: { include: weaponsInclude },
        field: true,
      },
    });

    const results = _results
      .map((value) => {
        const category = value.field.category;

        if (category === CustomFieldCategory.CITIZEN) {
          return value.Citizens;
        } else if (category === CustomFieldCategory.VEHICLE) {
          return value.RegisteredVehicles;
        }

        return value.Weapons;
      })
      .flat(1);

    return { field: customField, results } as APITypes.PostSearchCustomFieldData<true>;
  }
}

export function appendConfidential(
  citizens: (Citizen & { officers?: (Officer & { department: DepartmentValue | null })[] })[],
) {
  const _citizens = [];

  for (const citizen of citizens) {
    const isConfidential = citizen.officers?.some((v) => v.department?.isConfidential);

    if (isConfidential) {
      _citizens.push({
        id: citizen.id,
        name: citizen.name,
        surname: citizen.surname,
        isConfidential: true,
      });
    } else {
      _citizens.push(citizen);
    }
  }

  return _citizens;
}

export async function appendCustomFields(item: any, category: CustomFieldCategory) {
  const allCustomFields = await prisma.customField.findMany({
    where: { category },
  });

  if (Array.isArray(item)) {
    if (item.length > 0) {
      for (const cit of item) {
        cit.allCustomFields = allCustomFields;
      }
    }
  } else {
    item.allCustomFields = allCustomFields;
  }

  return item;
}
