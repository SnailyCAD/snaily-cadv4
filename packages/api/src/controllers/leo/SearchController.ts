import { Controller, UseBeforeEach } from "@tsed/common";
import { Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams } from "@tsed/platform-params";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares";
import { ActiveOfficer } from "../../middlewares/ActiveOfficer";

@Controller("/search")
@UseBeforeEach(IsAuth, ActiveOfficer)
export class SearchController {
  @Post("/weapon")
  async searchWeapon(@BodyParams("serialNumber") serialNumber: string) {
    const weapon = await prisma.weapon.findFirst({
      where: {
        serialNumber,
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
