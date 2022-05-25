import { Context, Middleware, Req, MiddlewareMethods } from "@tsed/common";
import { getSessionUser } from "lib/auth/getSessionUser";
import { getActiveDeputy } from "lib/ems-fd";

@Middleware()
export class ActiveDeputy implements MiddlewareMethods {
  async use(@Req() req: Req, @Context() ctx: Context) {
    const user = await getSessionUser(req);
    const officer = await getActiveDeputy(req, user, ctx);

    ctx.set("activeDeputy", officer);
  }
}
