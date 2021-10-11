import { Context, Res } from "@tsed/common";
import { Controller } from "@tsed/di";
import { UseBefore } from "@tsed/platform-middlewares";
import { Delete, Patch, Post } from "@tsed/schema";
import { Cookie } from "@snailycad/config";
import { prisma } from "../../lib/prisma";
import { IsAuth } from "../../middlewares/IsAuth";
import { setCookie } from "../../utils/setCookie";

@Controller("/user")
@UseBefore(IsAuth)
export class AccountController {
  @Post("/")
  async getAuthUser(@Context() ctx: Context) {
    return { ...ctx.get("user"), cad: ctx.get("cad") ?? null };
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

  @Post("/logout")
  async logoutUser(@Res() res: Res, @Context() ctx: Context) {
    ctx.delete("user");

    setCookie({
      res,
      name: Cookie.Session,
      expires: 0,
      value: "",
    });

    return true;
  }
}
