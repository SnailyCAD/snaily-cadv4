import * as React from "react";
import { useRouter } from "next/router";
import type { cad as CAD, Feature } from "@snailycad/types";

export function useIsRouteFeatureEnabled(cad: Partial<Pick<CAD, "features">>) {
  const [isEnabled, setIsEnabled] = React.useState(true);
  const router = useRouter();

  const featuresRoute: Partial<Record<Feature, string>> = {
    TOW: "/tow",
    BLEETER: "/bleeter",
    TAXI: "/taxi",
    TRUCK_LOGS: "/truck-logs",
    BUSINESS: "/business",
    DL_EXAMS: "/officer/supervisor/dl-exams",
    DMV: "/officer/dmv",
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function checkEnabled() {
    const features = cad.features ?? [];

    for (const feature of features) {
      const route = featuresRoute[feature.feature];

      if (route && !feature.isEnabled && router.pathname.includes(route)) {
        setIsEnabled(false);
        break;
      } else {
        setIsEnabled(true);
      }
    }

    return isEnabled;
  }

  React.useEffect(() => {
    checkEnabled();
  }, [checkEnabled, router]);

  return isEnabled;
}
