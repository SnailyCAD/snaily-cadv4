import { feature, Feature } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

export function useFeatureEnabled() {
  const { cad } = useAuth();
  const disabledFeatures = cad?.disabledFeatures ?? ["DISCORD_AUTH"];

  const obj: Record<Feature, boolean> = {} as Record<Feature, boolean>;

  Object.keys(feature).map((feature) => {
    obj[feature as Feature] = !disabledFeatures?.includes(feature as Feature);
  });

  return obj;
}
