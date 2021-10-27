import { Rank, User } from ".prisma/client";
import { Context, Middleware, Req, MiddlewareMethods } from "@tsed/common";
import { getSessionUser } from "../lib/auth";
import { prisma } from "../lib/prisma";

const CAD_SELECT = (user: Pick<User, "rank">) => ({
  id: true,
  name: true,
  areaOfPlay: true,
  maxPlateLength: true,
  towWhitelisted: true,
  whitelisted: true,
  disabledFeatures: true,
  liveMapSocketURl: user.rank === Rank.OWNER,
  registrationCode: user.rank === Rank.OWNER,
  steamApiKey: user.rank === Rank.OWNER,
  discordWebhookURL: true,
  miscCadSettings: true,
  miscCadSettingsId: true,
});

@Middleware()
export class IsAuth implements MiddlewareMethods {
  async use(@Req() req: Req, @Context() ctx: Context) {
    const user = await getSessionUser(req);

    let cad = await prisma.cad.findFirst({
      select: CAD_SELECT(user),
    });

    if (cad && !cad.miscCadSettings) {
      const miscSettings = await prisma.miscCadSettings.create({
        data: {},
      });

      cad = await prisma.cad.update({
        where: {
          id: cad.id,
        },
        data: {
          miscCadSettings: {
            connect: {
              id: miscSettings.id,
            },
          },
        },
        select: CAD_SELECT(user),
      });
    }

    ctx.set("cad", cad);
    ctx.set("user", user);
  }
}
