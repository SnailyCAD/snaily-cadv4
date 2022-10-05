import type { Feature } from "@prisma/client";
import { Middleware, MiddlewareMethods, Req } from "@tsed/common";
import { prisma } from "lib/prisma";
import { BadRequest } from "@tsed/exceptions";
import { setDiscordAuth } from "./IsAuth";

const featuresRoute: Partial<Record<Feature, string>> = {
  TOW: "/v1/tow",
  BLEETER: "/v1/bleeter",
  TAXI: "/v1/taxi",
  TRUCK_LOGS: "/v1/truck-logs",
  BUSINESS: "/v1/businesses",
  DISCORD_AUTH: "/v1/auth/discord",
  WEAPON_REGISTRATION: "/v1/weapons",
  CALLS_911: "/v1/911-calls",
  COURTHOUSE: "/v1/expungement-requests",
  ALLOW_CITIZEN_UPDATE_LICENSE: "/v1/licenses",
  RADIO_CHANNEL_MANAGEMENT: "/v1/dispatch/radio-channel",
  LICENSE_EXAMS: "/leo/exams",
  DMV: "/leo/dmv",
  USER_API_TOKENS: "/user/api-token",
  STEAM_OAUTH: "/v1/auth/steam",
  COURTHOUSE_POSTS: "/v1/courthouse-posts",
  ACTIVE_WARRANTS: "/v1/records/active-warrants",
  PANIC_BUTTON: "/v1/leo/panic-button",
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

      const route = featuresRoute[feature.feature];
      if (req.originalUrl.includes(route!) || req.baseUrl.includes(route!)) {
        throw new BadRequest("featureNotEnabled");
      }
    }
  }
}
