import { Feature } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

const DEFAULTS: Partial<Record<Feature, { isEnabled: boolean }>> = {
  CUSTOM_TEXTFIELD_VALUES: { isEnabled: false },
  DISCORD_AUTH: { isEnabled: false },
};

export function useFeatureEnabled() {
  const { cad } = useAuth();
  const features = cad?.features ?? [{ isEnabled: false, feature: Feature.DISCORD_AUTH }];

  const obj: Record<Feature, boolean> = {} as Record<Feature, boolean>;

  Object.keys(Feature).map((feature) => {
    const cadFeature = features.find((v) => v.feature === feature);
    const isEnabled = DEFAULTS[feature] ?? cadFeature?.isEnabled ?? true;

    obj[feature as Feature] = isEnabled;
  });

  return obj;
}
