import { Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { UseBefore } from "@tsed/platform-middlewares";
import { Delete, Patch, Post } from "@tsed/schema";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares/IsAuth";

@Controller("/user")
@UseBefore(IsAuth)
export class AccountController {
  @Post("/")
  async getAuthUser(@Context() ctx: Context) {
    return ctx.get("user");
  }

  @Patch("/")
  async patchAuthUser() {
    console.log("TODO");
  }

  @Delete("/")
  async deleteAuthUser(@Context() ctx: Context) {
    await prisma.user.delete({
      where: {
        id: ctx.get("user").id,
      },
    });
  }
}
