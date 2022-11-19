import { Middleware, MiddlewareMethods, Context } from "@tsed/common";
import { UseBefore } from "@tsed/platform-middlewares";
import { StoreSet, useDecorators } from "@tsed/core";
import type { Feature as DatabaseFeature } from "@prisma/client";
import { Feature as TypesFeature } from "@snailycad/types";
import { setDiscordAuth } from "./IsAuth";
import { prisma } from "lib/prisma";
import { FeatureNotEnabled } from "src/exceptions/feature-not-enabled";

export interface IsFeatureEnabledOptions {
  feature: TypesFeature | DatabaseFeature;
}

export const DEFAULT_DISABLED_FEATURES: Partial<
  Record<IsFeatureEnabledOptions["feature"], { isEnabled: boolean }>
> = {
  CUSTOM_TEXTFIELD_VALUES: { isEnabled: false },
  DISCORD_AUTH: { isEnabled: false },
  DMV: { isEnabled: false },
  USER_API_TOKENS: { isEnabled: false },
  CITIZEN_RECORD_APPROVAL: { isEnabled: false },
  COMMON_CITIZEN_CARDS: { isEnabled: false },
  STEAM_OAUTH: { isEnabled: false },
  CREATE_USER_CITIZEN_LEO: { isEnabled: false },
  ACTIVE_WARRANTS: { isEnabled: false },
  CITIZEN_DELETE_ON_DEAD: { isEnabled: false },
  WARRANT_STATUS_APPROVAL: { isEnabled: false },
  LICENSE_EXAMS: { isEnabled: false },
};

@Middleware()
class IsFeatureEnabledMiddleware implements MiddlewareMethods {
  async use(@Context() ctx: Context) {
    const options = ctx.endpoint.get<IsFeatureEnabledOptions>(IsFeatureEnabledMiddleware);

    const cad = setDiscordAuth(
      await prisma.cad.findFirst({
        select: {
          id: true,
          features: true,
        },
      }),
    );

    const cadFeature = cad?.features?.find((v) => v.feature === options.feature);

    const isEnabled =
      cadFeature?.isEnabled ??
      DEFAULT_DISABLED_FEATURES[options.feature as IsFeatureEnabledOptions["feature"]]?.isEnabled ??
      true;

    if (!isEnabled) {
      throw new FeatureNotEnabled(options);
    }
  }
}

export function IsFeatureEnabled(data: IsFeatureEnabledOptions) {
  return useDecorators(
    StoreSet(IsFeatureEnabledMiddleware, data),
    UseBefore(IsFeatureEnabledMiddleware),
  );
}

export { TypesFeature as Feature };
