import { Controller, UseBeforeEach, Context } from "@tsed/common";
import { ContentType, Description, Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, QueryParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { callInclude, leoProperties } from "utils/leo/includes";

import { citizenInclude } from "controllers/citizen/CitizenController";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import {
  type cad,
  type Citizen,
  CustomFieldCategory,
  type DepartmentValue,
  Feature,
  type Officer,
  WhitelistStatus,
  type User,
} from "@prisma/client";
import { validateSchema } from "lib/data/validate-schema";
import { CUSTOM_FIELD_SEARCH_SCHEMA } from "@snailycad/schemas";
import { isFeatureEnabled } from "lib/upsert-cad";
import { defaultPermissions, hasPermission } from "@snailycad/permissions";
import { shouldCheckCitizenUserId } from "lib/citizen/has-citizen-access";
import type * as APITypes from "@snailycad/types/api";
import { ExtendedBadRequest } from "~/exceptions/extended-bad-request";
import { setEndedSuspendedLicenses } from "lib/citizen/licenses/set-ended-suspended-licenses";
import { incidentInclude } from "../incidents/IncidentController";
import { officerOrDeputyToUnit } from "lib/leo/officerOrDeputyToUnit";

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

export const recordsInclude = (isRecordApprovalEnabled: boolean) => ({
  where: isRecordApprovalEnabled ? { status: WhitelistStatus.ACCEPTED } : undefined,
  include: {
    citizen: true,
    business: { select: { name: true, id: true } },
    officer: { include: leoProperties },
    seizedItems: true,
    courtEntry: { include: { dates: true } },
    vehicle: { include: { model: { include: { value: true } }, registrationStatus: true } },
    incident: { include: incidentInclude },
    call911: { include: callInclude },
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
});

export const citizenSearchIncludeOrSelect = (
  user: User,
  cad: cad & { features?: Record<Feature, boolean> },
) => {
  const isEnabled = isFeatureEnabled({
    feature: Feature.CITIZEN_RECORD_APPROVAL,
    features: cad.features,
    defaultReturn: false,
  });

  const isPendingWarrantsEnabled = isFeatureEnabled({
    feature: Feature.WARRANT_STATUS_APPROVAL,
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
  });

  if (hasPerms) {
    const warrantWhere = isPendingWarrantsEnabled
      ? { approvalStatus: WhitelistStatus.ACCEPTED }
      : {};

    return {
      include: {
        officers: { select: { department: { select: { isConfidential: true } } } },
        ...citizenInclude,
        vehicles: { include: vehicleSearchInclude },
        addressFlags: true,
        medicalRecords: true,
        DoctorVisit: true,
        customFields: { include: { field: true } },
        warrants: { where: warrantWhere, include: { officer: { include: leoProperties } } },
        notes: true,
        Record: recordsInclude(isEnabled),
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
  flags: true,
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

    if (!fromAuthUserOnly) {
      // todo: check for LEO perms
    }

    const checkUserId = shouldCheckCitizenUserId({ cad, user });

    if (citizenId) {
      const citizens = await prisma.citizen.findMany({
        where: { id: citizenId, userId: fromAuthUserOnly && checkUserId ? user.id : undefined },
        take: 35,
        ...citizenSearchIncludeOrSelect(user, cad),
      });

      const citizensWithCustomFields = await appendCustomFields(
        citizens,
        CustomFieldCategory.CITIZEN,
      );
      const citizensWithConfidential = appendConfidential(citizensWithCustomFields);

      return citizensWithConfidential as APITypes.PostLeoSearchCitizenData;
    }

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

    const citizensWithEndedSuspendedLicenses = await setEndedSuspendedLicenses(citizens);
    const citizensWithCustomFields = await appendCustomFields(
      citizensWithEndedSuspendedLicenses,
      CustomFieldCategory.CITIZEN,
    );
    const citizensWithConfidential = appendConfidential(citizensWithCustomFields);
    const citizensWithAssignedUnitData = appendAssignedUnitData(citizensWithConfidential);

    return citizensWithAssignedUnitData as APITypes.PostLeoSearchCitizenData;
  }

  @Post("/business")
  @Description("Search businesses by their name")
  @UsePermissions({
    permissions: [Permissions.Leo, Permissions.Dispatch],
  })
  async searchBusinessByName(
    @BodyParams("name") name: string,
    @Context("cad") cad: { features?: Record<Feature, boolean> },
  ): Promise<APITypes.PostLeoSearchBusinessData> {
    if (!name || name.length < 3) {
      return [];
    }

    const isEnabled = isFeatureEnabled({
      feature: Feature.CITIZEN_RECORD_APPROVAL,
      features: cad.features,
      defaultReturn: false,
    });

    const businesses = await prisma.business.findMany({
      where: {
        name: {
          contains: name,
          mode: "insensitive",
        },
      },
      include: {
        Record: recordsInclude(isEnabled),
        vehicles: {
          include: vehicleSearchInclude,
        },
        employees: {
          include: {
            citizen: true,
            role: { include: { value: true } },
          },
        },
      },
    });

    return businesses;
  }

  @Post("/weapon")
  @Description("Search weapons by their serialNumber")
  @UsePermissions({
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
    permissions: [Permissions.Leo, Permissions.Dispatch],
  })
  async searchVehicle(
    @BodyParams("plateOrVin", String) _plateOrVin?: string,
    @QueryParams("includeMany", Boolean) includeMany?: boolean,
  ): Promise<APITypes.PostLeoSearchVehicleData> {
    const trimmedPlateOrVin = _plateOrVin?.trim();

    if (!trimmedPlateOrVin || trimmedPlateOrVin.length <= 0) {
      return null;
    }

    const data = {
      where: {
        OR: [
          { plate: { startsWith: trimmedPlateOrVin.toUpperCase() } },
          { vinNumber: { startsWith: trimmedPlateOrVin.toUpperCase() } },
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

function appendAssignedUnitData(citizens: any[]) {
  return citizens.map((citizen) => {
    const _records = citizen?.Record ?? [];

    const newRecords = _records.map((record: any) => {
      if (record.call911) {
        return { ...record, call911: officerOrDeputyToUnit(record.call911) };
      }

      if (record.incident) {
        return { ...record, incident: officerOrDeputyToUnit(record.incident) };
      }

      return record;
    });

    return { ...citizen, Record: newRecords };
  });
}
