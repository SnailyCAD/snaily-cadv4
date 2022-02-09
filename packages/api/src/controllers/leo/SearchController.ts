import { Controller, UseBeforeEach } from "@tsed/common";
import { Description, Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams, QueryParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { ActiveOfficer } from "middlewares/ActiveOfficer";
import { leoProperties } from "lib/officer";
import { citizenInclude } from "controllers/citizen/CitizenController";

export const citizenSearchInclude = {
  ...citizenInclude,
  businesses: true,
  medicalRecords: true,
  warrants: { include: { officer: { include: leoProperties } } },
  Record: {
    include: {
      officer: {
        include: leoProperties,
      },
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
@UseBeforeEach(IsAuth, ActiveOfficer)
export class SearchController {
  @Post("/name")
  @Description("Search citizens by their name, surname or fullname")
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

    return citizen;
  }

  @Post("/weapon")
  @Description("Search weapons by their serialNumber")
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
  async searchVehicle(
    @QueryParams("includeMany") includeMany: boolean,
    @BodyParams("plateOrVin") plateOrVin: string,
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
        citizen: true,
        model: { include: { value: true } },
        registrationStatus: true,
        TruckLog: true,
        Business: true,
      },
    };

    if (includeMany) {
      const vehicles = await prisma.registeredVehicle.findMany(data);

      return vehicles;
    }

    const vehicle = await prisma.registeredVehicle.findFirst(data);

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    return vehicle;
  }
}
