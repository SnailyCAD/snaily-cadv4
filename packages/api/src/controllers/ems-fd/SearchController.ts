import { Controller, UseBeforeEach } from "@tsed/common";
import { Description, Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";

@Controller("/search")
@UseBeforeEach(IsAuth)
export class SearchController {
  @Post("/medical-records")
  @Description("Search medical records by citizen name")
  async searchName(@BodyParams("name") name: string) {
    const citizen = await prisma.citizen.findFirst({
      where: {
        name,
      },
      include: {
        medicalRecords: {
          include: {
            bloodGroup: true,
          },
        },
      },
    });

    if (!citizen) {
      throw new NotFound("citizenNotFound");
    }

    return citizen;
  }
}
