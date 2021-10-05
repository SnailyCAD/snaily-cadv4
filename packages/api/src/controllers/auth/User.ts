import { Context } from "@tsed/common";
import { Controller } from "@tsed/di";
import { UseBefore } from "@tsed/platform-middlewares";
import { Patch, Post } from "@tsed/schema";
import { IsAuth } from "../../middlewares/IsAuth";

@Controller("/account")
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
}
