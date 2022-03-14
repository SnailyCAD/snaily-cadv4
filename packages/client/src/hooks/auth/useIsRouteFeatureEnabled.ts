import * as React from "react";
import { useRouter } from "next/router";
import type { cad as CAD, Feature } from "@snailycad/types";

export function useIsRouteFeatureEnabled(cad: Partial<Pick<CAD, "disabledFeatures">>) {
  const [isEnabled, setIsEnabled] = React.useState(true);
  const router = useRouter();

  const featuresRoute: Partial<Record<Feature, string>> = {
    TOW: "/tow",
    BLEETER: "/bleeter",
    TAXI: "/taxi",
    TRUCK_LOGS: "/truck-logs",
    BUSINESS: "/business",
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  function checkEnabled() {
    const disabledFeatures = cad.disabledFeatures ?? [];

    for (const feature of disabledFeatures) {
      const route = featuresRoute[feature] as string;

      if (router.pathname.includes(route)) {
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
