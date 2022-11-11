import type { Feature } from "@prisma/client";
import { Middleware, MiddlewareMethods, Req } from "@tsed/common";
import { prisma } from "lib/prisma";
import { BadRequest } from "@tsed/exceptions";
import { setDiscordAuth } from "./IsAuth";

const featuresRoute: Partial<Record<Feature, `/v1/${string}`>> = {
  USER_API_TOKENS: "/v1/user/api-token",
  COURTHOUSE_POSTS: "/v1/courthouse-posts",
  ACTIVE_WARRANTS: "/v1/records/active-warrants",
  TONES: "/v1/dispatch/tones",
};

@Middleware()
export class IsEnabled implements MiddlewareMethods {
  async use(@Req() req: Req) {
    const cad = setDiscordAuth(
      await prisma.cad.findFirst({
        select: {
          id: true,
          features: true,
        },
      }),
    );

    const cadFeatures = cad?.features ?? [];
    for (const feature of cadFeatures) {
      if (feature.isEnabled) {
        continue;
      }

      const route = featuresRoute[feature.feature]!;
      if (req.originalUrl.includes(route)) {
        throw new BadRequest("featureNotEnabled");
      }
    }
  }
}
