import { Middleware, type MiddlewareMethods, Context, Next } from "@tsed/common";
import { UseBefore } from "@tsed/platform-middlewares";
import { StoreSet, useDecorators } from "@tsed/core";
import { type CadFeature, Feature as DatabaseFeature, Feature } from "@prisma/client";
import type { CadFeatureOptions, Feature as TypesFeature } from "@snailycad/types";
import { setCADFeatures } from "./auth/is-auth";
import { prisma } from "lib/data/prisma";
import { FeatureNotEnabled } from "~/exceptions/feature-not-enabled";

export interface IsFeatureEnabledOptions {
  feature: TypesFeature | DatabaseFeature | (TypesFeature | DatabaseFeature)[];
}

export const DEFAULT_DISABLED_FEATURES: Partial<
  Record<TypesFeature | DatabaseFeature, { isEnabled: boolean }>
> = {
  CUSTOM_TEXTFIELD_VALUES: { isEnabled: false },
  DISCORD_AUTH: { isEnabled: false },
  DMV: { isEnabled: false },
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
  FORCE_ACCOUNT_PASSWORD: { isEnabled: false },
  USER_DEFINED_CALLSIGN_COMBINED_UNIT: { isEnabled: false },
  REQUIRED_CITIZEN_IMAGE: { isEnabled: false },
  LEO_EDITABLE_CITIZEN_PROFILE: { isEnabled: false },
  ALLOW_MULTIPLE_UNITS_DEPARTMENTS_PER_USER: { isEnabled: false },
  CITIZEN_RECORD_PAYMENTS: { isEnabled: false },
};

export type CadFeatures = Record<TypesFeature | DatabaseFeature, boolean> & {
  options?: CadFeatureOptions;
};

export function createFeaturesObject(features?: CadFeature[] | undefined) {
  const obj: CadFeatures = {} as CadFeatures;
  const featureExtraOptions: CadFeatureOptions = {} as CadFeatureOptions;

  Object.keys(Feature).forEach((feature) => {
    const cadFeature = features?.find((v) => v.feature === feature);

    if (
      cadFeature?.extraFields &&
      ([Feature.LICENSE_EXAMS, Feature.COURTHOUSE] as string[]).includes(feature)
    ) {
      featureExtraOptions[feature as keyof CadFeatureOptions] = cadFeature.extraFields
        ? JSON.parse(cadFeature.extraFields as any)
        : null;
    }

    const isEnabled =
      // @ts-expect-error - this is fine
      cadFeature?.isEnabled ?? DEFAULT_DISABLED_FEATURES[feature]?.isEnabled ?? true;

    obj[feature as TypesFeature | DatabaseFeature] = isEnabled;
  });

  obj.options = featureExtraOptions;
  return obj;
}

export function overwriteFeatures(options: {
  features: ReturnType<typeof createFeaturesObject>;
  featuresToOverwrite: Partial<Record<Feature, boolean>>;
}) {
  return {
    ...options.features,
    ...options.featuresToOverwrite,
    options: options.features.options,
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
