import { Controller, UseBeforeEach } from "@tsed/common";
import { JsonRequestBody, Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams } from "@tsed/platform-params";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares";
import { ActiveOfficer } from "../../middlewares/ActiveOfficer";

const citizenSearchInclude = {
  businesses: true,
  vehicles: {
    include: {
      model: true,
      registrationStatus: true,
    },
  },
  weapons: {
    include: {
      model: true,
      registrationStatus: true,
    },
  },
  medicalRecords: true,
  ethnicity: true,
  gender: true,
  weaponLicense: true,
  driversLicense: true,
  ccw: true,
  pilotLicense: true,
  warrants: true,
  Record: {
    include: {
      officer: true,
      violations: true,
    },
  },
};

@Controller("/search")
@UseBeforeEach(IsAuth, ActiveOfficer)
export class SearchController {
  @Post("/name")
  async searchName(@BodyParams() body: JsonRequestBody) {
    const [name, surname] = body.get("name").toString().toLowerCase().split(/ +/g);

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
        model: true,
        registrationStatus: true,
      },
    });

    if (!weapon) {
      throw new NotFound("weaponNotFound");
    }

    return weapon;
  }

  @Post("/vehicle")
  async searchVehicle(@BodyParams("plateOrVin") plateOrVin: string) {
    if (!plateOrVin || plateOrVin.length < 3) {
      return null;
    }

    const vehicle = await prisma.registeredVehicle.findFirst({
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
      },
    });

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    return vehicle;
  }
}
