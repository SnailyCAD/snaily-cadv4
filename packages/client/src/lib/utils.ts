import { useRouter } from "next/router";
import React from "react";
import { cad as CAD, Feature } from "types/prisma";

const IMAGE_URL = "http://localhost:8080/";

export function makeImageUrl(type: "citizens" | "users" | "bleeter", id: string) {
  return `${IMAGE_URL}${type}/${id}`;
}

export function calculateAge(dateOfBirth: string | Date) {
  return ((Date.now() - new Date(dateOfBirth).getTime()) / (60 * 60 * 24 * 365.25 * 1000))
    .toString()
    .split(".")[0];
}

export function useIsFeatureEnabled(cad: Partial<Pick<CAD, "disabledFeatures">>) {
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
    const disabledFeatures = cad?.disabledFeatures ?? [];

    for (const feature of disabledFeatures) {
      const route = featuresRoute[feature];
      console.log({ route });

      if (router.pathname.includes(route!)) {
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
