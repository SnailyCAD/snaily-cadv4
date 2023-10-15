import * as React from "react";
import { type CadFeatureOptions, CourthouseType, Feature, LicenseExamType } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

export const DEFAULT_DISABLED_FEATURES = {
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
  CITIZEN_CREATION_RECORDS: { isEnabled: false },
  BUREAU_OF_FIREARMS: { isEnabled: false },
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
} satisfies Partial<Record<Feature, { isEnabled: boolean }>>;

export const DEFAULT_FEATURE_OPTIONS = {
  [Feature.LICENSE_EXAMS]: Object.values(LicenseExamType),
  [Feature.COURTHOUSE]: Object.values(CourthouseType),
} satisfies CadFeatureOptions;

export function useFeatureEnabled(
  features?: Record<Feature, boolean> & { options?: CadFeatureOptions },
) {
  const { cad } = useAuth();
  const _features = features ?? cad?.features;

  const options = React.useMemo(() => {
    const obj = {} as CadFeatureOptions;

    const cadFeatures = _features;
    for (const _key in _features) {
      const typedKey = _key as keyof CadFeatureOptions;
      const option = cadFeatures?.options?.[typedKey] ?? DEFAULT_FEATURE_OPTIONS[typedKey];

      if (option) {
        // @ts-expect-error the types are overlapping, however, it will correctly assign the correct value
        obj[typedKey] = option;
      }
    }

    return obj;
  }, [_features]);

  const featuresObj = React.useMemo(() => {
    const obj: Record<Feature, boolean> = {} as Record<Feature, boolean>;

    Object.keys(Feature).forEach((feature) => {
      const cadFeature = _features?.[feature as Feature];

      // @ts-expect-error - this is fine
      const isEnabled = cadFeature ?? DEFAULT_DISABLED_FEATURES[feature]?.isEnabled ?? true;

      obj[feature as Feature] = isEnabled;
    });

    return obj;
  }, [_features]);

  return { ...featuresObj, options };
}
