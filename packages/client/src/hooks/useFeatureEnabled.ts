import { Feature } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

export function useFeatureEnabled() {
  const { cad } = useAuth();
  const features = cad?.features ?? [{ isEnabled: false, feature: Feature.DISCORD_AUTH }];

  const obj: Record<Feature, boolean> = {} as Record<Feature, boolean>;

  Object.keys(Feature).map((feature) => {
    obj[feature as Feature] = features.some((v) => v.feature === feature && v.isEnabled);
  });

  return obj;
}
