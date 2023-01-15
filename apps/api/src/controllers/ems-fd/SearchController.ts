import { Controller, UseBeforeEach } from "@tsed/common";
import { ContentType, Description, Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";
import { appendConfidential } from "controllers/leo/search/SearchController";
import { citizenInclude } from "controllers/citizen/CitizenController";

const citizenSearchInclude = {
  ...citizenInclude,
  medicalRecords: { include: { bloodGroup: true } },
  officers: { include: { department: true } },
};

@Controller("/search")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class EMSFDSearchController {
  @Post("/medical-records")
  @Description("Search medical records by citizen name")
  @UsePermissions({
    fallback: (u) => u.isEmsFd,
    permissions: [Permissions.EmsFd],
  })
  async getMedicalRecords(@BodyParams("name") name: string) {
    const [citizen] = await this.findCitizensByName(name);

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    return citizen;
  }

  private async findCitizensByName(fullName: string) {
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
        ],
      },
      include: citizenSearchInclude,
      take: 35,
    });

    return appendConfidential(citizens);
  }
}
