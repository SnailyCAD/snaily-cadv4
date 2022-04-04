import { Controller, UseBeforeEach } from "@tsed/common";
import { Description, Header, Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, QueryParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { leoProperties } from "lib/leo/activeOfficer";
import { citizenInclude } from "controllers/citizen/CitizenController";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { CustomFieldCategory } from "@prisma/client";

export const citizenSearchInclude = {
  ...citizenInclude,
  businesses: true,
  medicalRecords: true,
  customFields: { include: { field: true } },
  warrants: { include: { officer: { include: leoProperties } } },
  Record: {
    include: {
      officer: {
        include: leoProperties,
      },
      seizedItems: true,
      violations: {
        include: {
          penalCode: true,
        },
      },
    },
  },
  dlCategory: { include: { value: true } },
};

@Controller("/search")
@UseBeforeEach(IsAuth)
@Header("content-type", "application/json")
export class SearchController {
  @Post("/name")
  @Description("Search citizens by their name, surname or fullname")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch,
    permissions: [Permissions.Leo, Permissions.Dispatch],
  })
  async searchName(@BodyParams("name") fullName: string) {
    const [name, surname] = fullName.toString().toLowerCase().split(/ +/g);

    if ((!name || name.length <= 3) && !surname) {
      return [];
    }

    let citizen = await prisma.citizen.findMany({
      where: {
        name: { contains: name, mode: "insensitive" },
        surname: { contains: surname, mode: "insensitive" },
      },
      include: citizenSearchInclude,
    });

    if (citizen.length <= 0) {
      citizen = await prisma.citizen.findMany({
        where: {
          socialSecurityNumber: name,
        },
        include: citizenSearchInclude,
      });
    }

    if (citizen.length <= 0) {
      citizen = await prisma.citizen.findMany({
        where: {
          name: { contains: surname, mode: "insensitive" },
          surname: { contains: name, mode: "insensitive" },
        },
        include: citizenSearchInclude,
      });
    }

    if (citizen.length <= 0 && (!name || !surname)) {
      citizen = await prisma.citizen.findMany({
        where: {
          name: { startsWith: name, mode: "insensitive" },
        },
        include: citizenSearchInclude,
      });
    }

    if (citizen.length <= 0 && (!name || !surname)) {
      citizen = await prisma.citizen.findMany({
        where: {
          surname: { startsWith: name, mode: "insensitive" },
        },
        include: citizenSearchInclude,
      });
    }

    return appendCustomFields(citizen, CustomFieldCategory.CITIZEN);
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
        },
      },
      include: {
        citizen: true,
        model: { include: { value: true } },
        registrationStatus: true,
      },
    });

    if (!weapon) {
      throw new NotFound("weaponNotFound");
    }

    return weapon;
  }

  @Post("/vehicle")
  @Description("Search vehicles by their plate or vinNumber")
  @UsePermissions({
    fallback: (u) => u.isLeo || u.isDispatch,
    permissions: [Permissions.Leo, Permissions.Dispatch],
  })
  async searchVehicle(
    @BodyParams("plateOrVin") plateOrVin: string,
    @QueryParams("includeMany") includeMany: boolean,
    @QueryParams("includeCitizenInfo") includeCitizenInfo?: boolean,
  ) {
    if (!plateOrVin || plateOrVin.length < 3) {
      return null;
    }

    const data = {
      where: {
        OR: [
          { plate: { startsWith: plateOrVin.toUpperCase() } },
          { vinNumber: { startsWith: plateOrVin } },
        ],
      },
      include: {
        model: { include: { value: true } },
        registrationStatus: true,
        insuranceStatus: true,
        TruckLog: true,
        Business: true,
        citizen: includeCitizenInfo ? { include: { warrants: true } } : true,
        flags: true,
        customFields: { include: { field: true } },
      },
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
