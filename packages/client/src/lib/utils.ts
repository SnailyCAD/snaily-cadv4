import { useRouter } from "next/router";
import React from "react";
import { FullDeputy, FullOfficer } from "state/dispatchState";
import { cad as CAD, Citizen, CombinedLeoUnit, Feature, Officer } from "types/prisma";
import { handleRequest } from "./fetch";
import { IncomingMessage } from "connect";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";

export function calculateAge(dateOfBirth: string | Date): string {
  const [age] = ((Date.now() - new Date(dateOfBirth).getTime()) / (60 * 60 * 24 * 365.25 * 1000))
    .toString()
    .split(".");

  return age as string;
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
    const disabledFeatures = cad.disabledFeatures ?? [];

    for (const feature of disabledFeatures) {
      const route = featuresRoute[feature]!;

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

type Config = [string, any?][];
export async function requestAll(
  req: IncomingMessage & { cookies?: NextApiRequestCookies },
  config: Config,
) {
  return Promise.all(
    config.map(async ([path, defaultValue = {}]) => {
      return handleRequest(path, {
        req,
      })
        .then((v) => (typeof v.data === "undefined" ? defaultValue : v.data))
        .catch(() => defaultValue);
    }),
  );
}

export function makeUnitName(unit: Officer | FullDeputy | CombinedLeoUnit) {
  if (!("citizen" in unit)) {
    return "";
  }

  return `${unit.citizen.name} ${unit.citizen.surname}`;
}

export function yesOrNoText(t: boolean): "yes" | "no" {
  return t ? "yes" : "no";
}

export function formatUnitDivisions(unit: FullOfficer | FullDeputy) {
  const division = unit.division?.value.value;
  if (!("divisions" in unit)) return division as string;
  const divisions = unit.divisions.map((d) => d.value.value).join(", ");

  return division ?? divisions;
}

export function formatCitizenAddress(citizen: Pick<Citizen, "address" | "postal">) {
  const { address, postal } = citizen;
  return `${address} ${postal ? `(${postal})` : ""}`;
}
