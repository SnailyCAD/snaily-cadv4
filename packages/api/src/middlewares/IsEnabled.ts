import { Feature } from ".prisma/client";
import { Middleware, MiddlewareMethods, Req } from "@tsed/common";
import { prisma } from "../lib/prisma";
import { BadRequest } from "@tsed/exceptions";

const featuresRoute: Partial<Record<Feature, string>> = {
  TOW: "/v1/tow",
  BLEETER: "/v1/bleeter",
  TAXI: "/v1/taxi",
  TRUCK_LOGS: "/v1/truck-logs",
};

@Middleware()
export class IsEnabled implements MiddlewareMethods {
  async use(@Req() req: Req) {
    const cad = (await prisma.cad.findFirst({
      select: {
        id: true,
        disabledFeatures: true,
      },
    })) ?? { disabledFeatures: [] };

    for (const feature of cad.disabledFeatures) {
      const route = featuresRoute[feature];

      if (req.baseUrl.includes(route!)) {
        throw new BadRequest("featureNotEnabled");
      }
    }
  }
}
