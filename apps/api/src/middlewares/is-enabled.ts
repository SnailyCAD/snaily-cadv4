import { Middleware, MiddlewareMethods, Context, Next } from "@tsed/common";
import { UseBefore } from "@tsed/platform-middlewares";
import { StoreSet, useDecorators } from "@tsed/core";
import { CadFeature, Feature as DatabaseFeature, Feature } from "@prisma/client";
import type { Feature as TypesFeature } from "@snailycad/types";
import { setCADFeatures } from "./is-auth";
import { prisma } from "lib/data/prisma";
import { FeatureNotEnabled } from "src/exceptions/feature-not-enabled";

export interface IsFeatureEnabledOptions {
  feature: TypesFeature | DatabaseFeature | (TypesFeature | DatabaseFeature)[];
}

export const DEFAULT_DISABLED_FEATURES: Partial<
  Record<TypesFeature | DatabaseFeature, { isEnabled: boolean }>
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
  CALL_911_APPROVAL: { isEnabled: false },
  FORCE_DISCORD_AUTH: { isEnabled: false },
  FORCE_STEAM_AUTH: { isEnabled: false },
  SIGNAL_100_CITIZEN: { isEnabled: false },
};

export function createFeaturesObject(features?: CadFeature[] | undefined) {
  const obj: Record<TypesFeature | DatabaseFeature, boolean> = {} as Record<
    TypesFeature | DatabaseFeature,
    boolean
  >;

  Object.keys(Feature).map((feature) => {
    const cadFeature = features?.find((v) => v.feature === feature);

    const isEnabled =
      // @ts-expect-error - this is fine
      cadFeature?.isEnabled ?? DEFAULT_DISABLED_FEATURES[feature]?.isEnabled ?? true;

    obj[feature as TypesFeature | DatabaseFeature] = isEnabled;
  });

  return obj;
}

export function overwriteFeatures(options: {
  features: ReturnType<typeof createFeaturesObject>;
  featuresToOverwrite: Partial<Record<Feature, boolean>>;
}) {
  return {
    ...options.features,
    ...options.featuresToOverwrite,
  };
}

@Middleware()
class IsFeatureEnabledMiddleware implements MiddlewareMethods {
  async use(@Context() ctx: Context, @Next() next: Next) {
    const options = ctx.endpoint.get<IsFeatureEnabledOptions>(IsFeatureEnabledMiddleware);

    const cad = setCADFeatures(
      await prisma.cad.findFirst({
        select: {
          id: true,
          features: true,
        },
      }),
    );

    let isEnabled = Array.isArray(options.feature)
      ? false
      : cad.features[options.feature as TypesFeature];

    if (Array.isArray(options.feature)) {
      for (const feature of options.feature) {
        if (cad.features[feature as TypesFeature]) {
          isEnabled = true;
          break;
        }
      }
    }

    if (!isEnabled) {
      throw new FeatureNotEnabled(options);
    }

    next();
  }
}

export function IsFeatureEnabled(data: IsFeatureEnabledOptions) {
  return useDecorators(
    StoreSet(IsFeatureEnabledMiddleware, data),
    UseBefore(IsFeatureEnabledMiddleware),
  );
}

export { DatabaseFeature as Feature };
