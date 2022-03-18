import { Rank, WhitelistStatus } from "@prisma/client";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { BodyParams, PathParams } from "@tsed/platform-params";
import { Description, Get, Put } from "@tsed/schema";
import { prisma } from "lib/prisma";
import { IsAuth } from "middlewares/IsAuth";
import { UsePermissions, Permissions } from "middlewares/UsePermissions";

@UseBeforeEach(IsAuth)
@Controller("/admin/manage/name-change-requests")
export class AdminNameChangeController {
  @Get("/")
  @Description("Get all the name change requests")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [
      Permissions.ViewNameChangeRequests,
      Permissions.DeleteNameChangeRequests,
      Permissions.ManageNameChangeRequests,
    ],
  })
  async getRequests() {
    const requests = await prisma.nameChangeRequest.findMany({
      include: { citizen: true },
    });

    return requests;
  }

  @Put("/:id")
  @Description("Accept or decline a name change request.")
  @UsePermissions({
    fallback: (u) => u.rank !== Rank.USER,
    permissions: [Permissions.ManageNameChangeRequests],
  })
  async acceptOrDeclineNameChangeRequest(
    @PathParams("id") id: string,
    @BodyParams("type") type: WhitelistStatus,
  ) {
    const isCorrect = Object.values(WhitelistStatus).includes(type);
    if (!isCorrect) {
      throw new BadRequest("invalidType");
    }

    const request = await prisma.nameChangeRequest.findUnique({
      where: { id },
    });

    if (!request) {
      throw new NotFound("requestNotFound");
    }

    if (type === WhitelistStatus.ACCEPTED) {
      await prisma.citizen.update({
        where: { id: request.citizenId },
        data: {
          name: request.newName ?? undefined,
          surname: request.newSurname ?? undefined,
        },
      });
    }

    const updated = await prisma.nameChangeRequest.update({
      where: { id },
      data: {
        status: type,
      },
    });

    return updated;
  }
}
