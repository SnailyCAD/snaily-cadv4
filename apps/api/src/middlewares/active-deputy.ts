import { Context, Middleware, Req, MiddlewareMethods, Res, Next } from "@tsed/common";
import { getSessionUser } from "lib/auth/getSessionUser";
import { getActiveDeputy } from "lib/get-active-ems-fd-deputy";

@Middleware()
export class ActiveDeputy implements MiddlewareMethods {
  async use(@Req() req: Req, @Res() res: Res, @Context() ctx: Context, @Next() next: Next) {
    const user = await getSessionUser({ req, res });
    const deputy = await getActiveDeputy({ req, user, ctx });

    ctx.set("activeDeputy", deputy);

    next();
  }
}
