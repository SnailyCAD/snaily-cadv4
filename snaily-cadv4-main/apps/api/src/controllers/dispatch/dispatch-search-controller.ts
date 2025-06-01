import { Controller, UseBeforeEach } from "@tsed/common";
import { ContentType, Description, Post } from "@tsed/schema";
import { BodyParams } from "@tsed/platform-params";
import { prisma } from "lib/data/prisma";
import { IsAuth } from "middlewares/auth/is-auth";
import { UsePermissions, Permissions } from "middlewares/use-permissions";

@Controller("/search")
@UseBeforeEach(IsAuth)
@ContentType("application/json")
export class SearchController {
  @Post("/address")
  @Description("Search citizens by their address")
  @UsePermissions({
    permissions: [Permissions.Dispatch],
  })
  async searchAddress(@BodyParams("address") address: string) {
    const citizens = await prisma.citizen.findMany({
      where: {
        address: {
          contains: address,
          mode: "insensitive",
        },
      },
      include: { warrants: true },
    });

    if (citizens.length <= 0) {
      return [];
    }

    return citizens;
  }
}
