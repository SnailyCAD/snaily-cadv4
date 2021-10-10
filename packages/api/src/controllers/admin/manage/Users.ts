import { Rank } from ".prisma/client";
import { PathParams, BodyParams, Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { UseBeforeEach } from "@tsed/platform-middlewares";
import { Get, JsonRequestBody, Post } from "@tsed/schema";
import { userProperties } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { IsAuth, IsAdmin } from "../../../middlewares";
import { BAN_SCHEMA, validate } from "@snailycad/schemas";

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

  @Post("/:id")
  async updateUserById(@PathParams("id") userId: string, @BodyParams() body: JsonRequestBody) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    body;
    if (!user) {
      throw new NotFound("notFound");
    }

    return "TODO";

    // return user;
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
