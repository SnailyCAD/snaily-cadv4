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

    if (!name && !surname) {
      return [];
    }

    let citizen = await prisma.citizen.findMany({
      where: {
        name: { contains: name, mode: "insensitive" },
        surname: { contains: surname, mode: "insensitive" },
      },
      include: citizenSearchInclude,
    });

    if (!citizen) {
      citizen = await prisma.citizen.findMany({
        where: {
          name: { contains: name, mode: "insensitive" },
        },
        include: citizenSearchInclude,
      });
    }

    if (!citizen) {
      citizen = await prisma.citizen.findMany({
        where: {
          surname: { contains: name, mode: "insensitive" },
        },
        include: citizenSearchInclude,
      });
    }

    if (!citizen) {
      citizen = await prisma.citizen.findMany({
        where: {
          name: { contains: surname, mode: "insensitive" },
        },
        include: citizenSearchInclude,
      });
    }

    if (!citizen) {
      citizen = await prisma.citizen.findMany({
        where: {
          surname: { contains: surname, mode: "insensitive" },
        },
        include: citizenSearchInclude,
      });
    }

    if (!citizen) {
      throw new NotFound("citizenNotFound");
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

    // not using Prisma's `OR` since it doesn't seem to be working 🤔
    let vehicle = await prisma.registeredVehicle.findFirst({
      where: {
        plate: plateOrVin.toUpperCase(),
      },
      include: {
        citizen: true,
        model: true,
        registrationStatus: true,
      },
    });

    if (!vehicle) {
      vehicle = await prisma.registeredVehicle.findFirst({
        where: {
          vinNumber: plateOrVin,
        },
        include: {
          citizen: true,
          model: true,
          registrationStatus: true,
        },
      });
    }

    if (!vehicle) {
      throw new NotFound("vehicleNotFound");
    }

    return vehicle;
  }
}
