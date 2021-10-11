import { Rank } from ".prisma/client";
import { PathParams, BodyParams, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Get, JsonRequestBody, Post, Put } from "@tsed/schema";
import { userProperties } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { IsAuth, IsAdmin } from "../../../middlewares";
import { BAN_SCHEMA, UPDATE_USER_SCHEMA, validate } from "@snailycad/schemas";

@UseBeforeEach(IsAuth, IsAdmin)
@Controller("/users")
export class ManageUsersController {
  @Get("/")
  async getUsers() {
    const users = await prisma.user.findMany();

    return users;
  }

  @Get("/:id")
  async getUserById(@PathParams("id") userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: userProperties });

    return user;
  }

  @Put("/:id")
  async updateUserById(@PathParams("id") userId: string, @BodyParams() body: JsonRequestBody) {
    const error = validate(UPDATE_USER_SCHEMA, body.toJSON(), true);

    if (error) {
      throw new BadRequest(error);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFound("notFound");
    }

    if (user.rank === Rank.OWNER && body.get("rank") !== Rank.OWNER) {
      throw new BadRequest("cannotUpdateOwnerRank");
    }

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        isLeo: body.get("isLeo"),
        isSupervisor: body.get("isSupervisor"),
        isDispatch: body.get("isDispatch"),
        isEmsFd: body.get("isEmsFd"),
        isTow: body.get("isTow"),
        steamId: body.get("steamId"),
        rank: user.rank === Rank.OWNER ? Rank.OWNER : Rank[body.get("rank") as Rank],
      },
      select: userProperties,
    });

    return updated;
  }

  @Post("/:id/:type")
  async banUserById(
    @Context() ctx: Context,
    @PathParams("id") userId: string,
    @PathParams("type") banType: "ban" | "unban",
    @BodyParams() body: JsonRequestBody,
  ) {
    if (!["ban", "unban"].includes(banType)) {
      throw new NotFound("notFound");
    }

    if (banType === "ban") {
      const error = validate(BAN_SCHEMA, body.toJSON(), true);
      if (error) {
        throw new BadRequest(error);
      }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFound("notFound");
    }

    if (user.rank === Rank.OWNER || ctx.get("user").id === user.id) {
      throw new BadRequest("cannotBanSelfOrOwner");
    }

    const updated = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        banReason: banType === "ban" ? body.get("reason") : null,
        banned: banType === "ban",
      },
      select: userProperties,
    });

    return updated;
  }
}
