import { useRouter } from "next/router";
import React from "react";
import { cad as CAD, Feature } from "types/prisma";
import { handleRequest } from "./fetch";

const url = (process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080/v1").replace("/v1", "");
const IMAGE_URL = `http://${url}static/`;

export function makeImageUrl(type: "citizens" | "users" | "bleeter" | "units", id: string) {
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
        headers: req.headers,
        req,
      })
        .then((v) => v.data)
        .catch(() => defaultValue);
    }),
  );
}
