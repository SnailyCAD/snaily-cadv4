import { Feature } from ".prisma/client";
import { Middleware, MiddlewareMethods, Req } from "@tsed/common";
import { prisma } from "../lib/prisma";
import { BadRequest } from "@tsed/exceptions";
import { setDiscordAUth } from ".";

const featuresRoute: Partial<Record<Feature, string>> = {
  TOW: "/v1/tow",
  BLEETER: "/v1/bleeter",
  TAXI: "/v1/taxi",
  TRUCK_LOGS: "/v1/truck-logs",
  BUSINESS: "/v1/businesses",
  DISCORD_AUTH: "/v1/auth/discord",
};

@Middleware()
export class IsEnabled implements MiddlewareMethods {
  async use(@Req() req: Req) {
    const cad = setDiscordAUth(
      await prisma.cad.findFirst({
        select: {
          id: true,
          disabledFeatures: true,
        },
      }),
    );

    const disabledFeatures = cad?.disabledFeatures ?? [];
    for (const feature of disabledFeatures) {
      const route = featuresRoute[feature as Feature];

      if (req.originalUrl.includes(route!) || req.baseUrl.includes(route!)) {
        throw new BadRequest("featureNotEnabled");
      }
    }
  }
}
