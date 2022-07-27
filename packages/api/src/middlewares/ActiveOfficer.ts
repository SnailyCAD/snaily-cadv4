import { Context, Middleware, Req, MiddlewareMethods } from "@tsed/common";
import { Unauthorized } from "@tsed/exceptions";
import { getSessionUser } from "lib/auth/getSessionUser";
import { getActiveOfficer } from "lib/leo/activeOfficer";

@Middleware()
export class ActiveOfficer implements MiddlewareMethods {
  async use(@Req() req: Req, @Context() ctx: Context) {
    const user = await getSessionUser(req).catch(() => null);
    if (!user && !req.originalUrl.includes("/v1/records")) {
      throw new Unauthorized("Unauthorized");
    }

    const officer = user && (await getActiveOfficer(req, user, ctx));

    ctx.set("activeOfficer", officer);
  }
}
