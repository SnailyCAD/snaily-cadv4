import { Controller, UseBeforeEach } from "@tsed/common";
import { Description, Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";
import { appendConfidential } from "controllers/leo/search/SearchController";
import { citizenInclude } from "controllers/citizen/CitizenController";

const citizenSearchInclude = {
  ...citizenInclude,
  medicalRecords: { include: { bloodGroup: true } },
  officers: { include: { department: true } },
};

@Controller("/search")
@UseBeforeEach(IsAuth)
export class SearchController {
  @Post("/medical-name")
  @Description("Search citizens by name for medical records")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async searchName(@BodyParams("name") fullName: string) {
    const citizen = await this.findCitizenByName(fullName);
    return citizen;
  }

  @Post("/medical-records")
  @Description("Search medical records by citizen name")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async getMedicalRecords(@BodyParams("name") name: string) {
    const [citizen] = await this.findCitizenByName(name);

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    return citizen;
  }

  private async findCitizenByName(fullName: string) {
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
          surname: { startsWith: name, mode: "insensitive" },
        },
        include: citizenSearchInclude,
      });
    }

    return appendConfidential(citizen);
  }
}
