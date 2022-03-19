import { Controller, UseBeforeEach } from "@tsed/common";
import { Description, Post } from "@tsed/schema";
import { NotFound } from "@tsed/exceptions";
import { BodyParams } from "@tsed/platform-params";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

@Controller("/search")
@UseBeforeEach(IsAuth)
export class SearchController {
  @Post("/address")
  @Description("Search citizens by their address")
  @UsePermissions({
    fallback: (u) => u.isDispatch,
    permissions: [Permissions.Dispatch],
  })
  async searchAddress(@BodyParams("address") address: string) {
    const citizens = await prisma.citizen.findMany({
      where: {
        address: {
          contains: address,
        },
      },
      include: {
        warrants: true,
      },
    });

    if (citizens.length <= 0) {
      throw new NotFound("citizenNotFound");
    }

    return citizens;
  }
}
