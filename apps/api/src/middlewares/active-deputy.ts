import { Context, Middleware, Req, MiddlewareMethods, Res } from "@tsed/common";
import { getSessionUser } from "lib/auth/getSessionUser";
import { getActiveDeputy } from "lib/ems-fd";

@Middleware()
export class ActiveDeputy implements MiddlewareMethods {
  async use(@Req() req: Req, @Res() res: Res, @Context() ctx: Context) {
    const user = await getSessionUser({ req, res });
    const deputy = await getActiveDeputy({ req, user, ctx });

    ctx.set("activeDeputy", deputy);
  }
}
