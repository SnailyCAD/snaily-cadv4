import * as React from "react";
import { Feature } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

export const DEFAULT_DISABLED_FEATURES = {
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
  CITIZEN_CREATION_RECORDS: { isEnabled: false },
  BUREAU_OF_FIREARMS: { isEnabled: false },
  CALL_911_APPROVAL: { isEnabled: false },
  FORCE_DISCORD_AUTH: { isEnabled: false },
  FORCE_STEAM_AUTH: { isEnabled: false },
  SIGNAL_100_CITIZEN: { isEnabled: false },
} satisfies Partial<Record<Feature, { isEnabled: boolean }>>;

export function useFeatureEnabled(features?: Record<Feature, boolean>) {
  const { cad } = useAuth();
  const _features = features ?? cad?.features;

  const featuresObj = React.useMemo(() => {
    const obj: Record<Feature, boolean> = {} as Record<Feature, boolean>;

    Object.keys(Feature).map((feature) => {
      const cadFeature = _features?.[feature as Feature];

      // @ts-expect-error - this is fine
      const isEnabled = cadFeature ?? DEFAULT_DISABLED_FEATURES[feature]?.isEnabled ?? true;

      obj[feature as Feature] = isEnabled;
    });

    return obj;
  }, [_features]);

  return featuresObj;
}
