import { Controller, UseBeforeEach } from "@tsed/common";
import { Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/index";
import { ActiveDeputy } from "middlewares/ActiveDeputy";

@Controller("/search")
@UseBeforeEach(IsAuth, ActiveDeputy)
export class SearchController {
  @Post("/medical-records")
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
