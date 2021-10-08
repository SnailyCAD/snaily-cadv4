import { Middleware, MiddlewareMethods, Req } from "@tsed/common";
import { Forbidden } from "@tsed/exceptions";
import { getSessionUser } from "../lib/auth";

@Middleware()
export class IsAdmin implements MiddlewareMethods {
  async use(@Req() req: Req) {
    const user = await getSessionUser(req);

    if (!user) {
      throw new Forbidden("Invalid Permissions");
    }

    if (!["OWNER", "ADMIN"].includes(user.rank)) {
      throw new Forbidden("Invalid Permissions");
    }
  }
}
