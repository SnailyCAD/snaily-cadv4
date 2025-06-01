import * as React from "react";
import { useRouter } from "next/router";
import type { cad as CAD, Feature } from "@snailycad/types";

const featuresRoute: Partial<Record<Feature, string>> = {
  TOW: "/tow",
  BLEETER: "/bleeter",
  TAXI: "/taxi",
  TRUCK_LOGS: "/truck-logs",
  BUSINESS: "/business",
  LICENSE_EXAMS: "/officer/supervisor/exams",
  DMV: "/officer/dmv",
};

export function useIsRouteFeatureEnabled(cad: Partial<Pick<CAD, "features">>) {
  const [isEnabled, setIsEnabled] = React.useState(true);
  const router = useRouter();

  const checkEnabled = React.useCallback(() => {
    const features = cad.features;
    let isEnabled = true;

    for (const key in features) {
      const feature = features[key as keyof typeof features];

      const route = key in featuresRoute && featuresRoute[key as keyof typeof featuresRoute];

      if (route && !feature && router.pathname.includes(route)) {
        isEnabled = false;
        break;
      } else {
        isEnabled = true;
      }
    }

    return isEnabled;
  }, [cad.features, router.pathname]);

  React.useEffect(() => {
    setIsEnabled(checkEnabled());
  }, [checkEnabled, router]);

  return isEnabled;
}
