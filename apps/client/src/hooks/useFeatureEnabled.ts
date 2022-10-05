import * as React from "react";
import { CadFeature, Feature } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

export const DEFAULT_DISABLED_FEATURES: Partial<Record<Feature, { isEnabled: boolean }>> = {
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

export function useFeatureEnabled(features?: CadFeature[]) {
  const { cad } = useAuth();
  const _features = features ?? cad?.features;

  const featuresObj = React.useMemo(() => {
    const obj: Record<Feature, boolean> = {} as Record<Feature, boolean>;

    Object.keys(Feature).map((feature) => {
      const cadFeature = _features?.find((v) => v.feature === feature);
      const isEnabled =
        cadFeature?.isEnabled ?? DEFAULT_DISABLED_FEATURES[feature as Feature]?.isEnabled ?? true;

      obj[feature as Feature] = isEnabled;
    });

    return obj;
  }, [_features]);

  return featuresObj;
}
