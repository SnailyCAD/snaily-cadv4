import { Controller, UseBeforeEach, Context } from "@tsed/common";
import { Description, Header, Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, QueryParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { leoProperties } from "lib/leo/activeOfficer";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import {
  cad,
  CadFeature,
  Citizen,
  CustomFieldCategory,
  DepartmentValue,
  Feature,
  Officer,
  WhitelistStatus,
} from "@prisma/client";
import { validateSchema } from "lib/validateSchema";
import { CUSTOM_FIELD_SEARCH_SCHEMA } from "@snailycad/schemas";
import { isFeatureEnabled } from "lib/cad";

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

export const citizenSearchInclude = (cad: cad & { features?: CadFeature[] }) => {
  const isEnabled = isFeatureEnabled({
    feature: Feature.CITIZEN_RECORD_APPROVAL,
    features: cad.features,
    defaultReturn: false,
  });

  return {
    officers: { select: { department: { select: { isConfidential: true } } } },
    ...citizenInclude,
    vehicles: { include: vehicleSearchInclude },
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
  };
};

const weaponsInclude = {
  citizen: true,
  model: { include: { value: true } },
  registrationStatus: true,
  customFields: { include: { field: true } },
};

@Controller("/search")
@UseBeforeEach(IsAuth)
@Header("content-type", "application/json")
export class SearchController {
  @Post("/name")
  @Description("Search citizens by their name, surname or fullname. Returns the first 35 results.")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch,
    permissions: [Permissions.Leo, Permissions.Dispatch],
  })
  async searchName(
    @BodyParams("name") fullName: string,
    @Context("cad") cad: cad & { features?: CadFeature[] },
  ) {
    const [name, surname] = fullName.toString().toLowerCase().split(/ +/g);

    if ((!name || name.length <= 3) && !surname) {
      return [];
    }

    const citizens = await prisma.citizen.findMany({
      where: {
        OR: [
          {
            name: { contains: name, mode: "insensitive" },
            surname: { contains: surname, mode: "insensitive" },
          },
          { socialSecurityNumber: name },
          {
            name: { contains: surname, mode: "insensitive" },
            surname: { contains: name, mode: "insensitive" },
          },
          { name: { startsWith: name, mode: "insensitive" } },
          { surname: { startsWith: surname, mode: "insensitive" } },
        ],
      },
      include: citizenSearchInclude(cad),
      take: 35,
    });

    return appendConfidential(await appendCustomFields(citizens, CustomFieldCategory.CITIZEN));
  }

  @Post("/weapon")
  @Description("Search weapons by their serialNumber")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch,
    permissions: [Permissions.Leo, Permissions.Dispatch],
  })
  async searchWeapon(@BodyParams("serialNumber") serialNumber: string) {
    if (!serialNumber || serialNumber.length < 3) {
      return null;
    }

    const weapon = await prisma.weapon.findFirst({
      where: {
        serialNumber: {
          startsWith: serialNumber,
          mode: "insensitive",
        },
      },
      include: weaponsInclude,
    });

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
    @BodyParams("plateOrVin") plateOrVin: string,
    @QueryParams("includeMany", Boolean) includeMany: boolean,
  ) {
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
    @Context("cad") cad: cad & { features?: CadFeature[] },
  ) {
    const data = validateSchema(CUSTOM_FIELD_SEARCH_SCHEMA, body);

    const customField = await prisma.customField.findUnique({
      where: { id: data.customFieldId },
    });

    const _results = await prisma.customFieldValue.findMany({
      where: { fieldId: data.customFieldId, value: { mode: "insensitive", equals: data.query } },
      include: {
        Citizens: { include: citizenSearchInclude(cad) },
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

    return { field: customField, results };
  }
}

export function appendConfidential(
  citizens: (Citizen & { officers: (Officer & { department: DepartmentValue | null })[] })[],
) {
  const _citizens = [];

  for (const citizen of citizens) {
    const isConfidential = citizen.officers.some((v) => v.department?.isConfidential);

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

async function appendCustomFields(item: any, category: CustomFieldCategory) {
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
