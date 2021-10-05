import { Context, Middleware, Req, MiddlewareMethods } from "@tsed/common";
import { NotFound, Unauthorized } from "@tsed/exceptions";
import { parse } from "cookie";
import { Cookie } from "../config";
import { prisma } from "../lib/prisma";
import { verifyJWT } from "../utils/jwt";

@Middleware()
export class IsAuth implements MiddlewareMethods {
  async use(@Req() req: Req, @Context() ctx: Context) {
    const header = req.headers.cookie;

    if (!header) {
      throw new Unauthorized("Unauthorized");
    }

    const cookie = parse(header)[Cookie.Session];
    const jwtPayload = verifyJWT(cookie!);

    if (!jwtPayload) {
      throw new Unauthorized("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: {
        id: jwtPayload.userId,
      },
    });

    if (!user) {
      throw new NotFound("User not found");
    }

    ctx.set("user", user);
  }
}
