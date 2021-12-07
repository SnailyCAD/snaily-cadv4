import { useRouter } from "next/router";
import React from "react";
import { FullDeputy } from "state/dispatchState";
import { cad as CAD, Feature, Officer } from "types/prisma";
import { handleRequest } from "./fetch";

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

type Config = [string, any?][];
export async function requestAll(req: any, config: Config) {
  return Promise.all(
    config.map(async ([path, defaultValue = {}]) => {
      return handleRequest(path, {
        req,
      })
        .then((v) => (typeof v.data === "undefined" ? defaultValue : v.data))
        .catch((e) => {
          if (process.env.DEBUG_ERROR === "true") {
            console.log(e);
          }

          return defaultValue;
        });
    }),
  );
}

export function makeUnitName(officer: Officer | FullDeputy) {
  return `${officer.citizen.name} ${officer.citizen.surname}`;
}
