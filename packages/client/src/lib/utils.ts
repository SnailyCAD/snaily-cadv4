import { useRouter } from "next/router";
import React from "react";
import type { FullDeputy, FullOfficer } from "state/dispatchState";
import {
  type cad as CAD,
  type Citizen,
  type CombinedLeoUnit,
  type Feature,
  type Officer,
  type Value,
  type ValueLicenseType,
  WhitelistStatus,
  ValueType,
  EmsFdDeputy,
} from "@snailycad/types";
import { handleRequest } from "./fetch";
import type { IncomingMessage } from "connect";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";
import format from "date-fns/format";

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

export function makeUnitName(unit: Officer | EmsFdDeputy | CombinedLeoUnit) {
  if (!("citizen" in unit)) {
    return "";
  }

  return `${unit.citizen.name} ${unit.citizen.surname}`;
}

export function yesOrNoText(t: boolean): "yes" | "no" {
  return t ? "yes" : "no";
}

export function formatUnitDivisions(unit: FullOfficer | FullDeputy) {
  const division = "division" in unit && unit.division?.value.value;
  if (!("divisions" in unit)) return division as string;
  const divisions = unit.divisions.map((d) => d.value.value).join(", ");

  return division ?? divisions;
}

export function formatCitizenAddress(citizen: Pick<Citizen, "address" | "postal">) {
  const { address, postal } = citizen;
  return `${address} ${postal ? `(${postal})` : ""}`;
}

export function formatDate(date: string | Date | number, options?: { onlyDate: boolean }) {
  const dateObj = new Date(date);
  const hmsString = options?.onlyDate ? "" : "HH:mm:ss";
  return format(dateObj, `yyyy-MM-dd ${hmsString}`);
}

export function filterLicenseTypes(licenses: Value<ValueType.LICENSE>[], type: ValueLicenseType) {
  return licenses.filter((item) => {
    if (item.licenseType === null) return true;
    return item.licenseType === type;
  });
}

export function getUnitDepartment(unit: FullOfficer | FullDeputy | null) {
  if (!unit) return null;

  const whitelistStatus = "whitelistStatus" in unit ? unit.whitelistStatus : null;

  if (whitelistStatus) {
    if (whitelistStatus.status === WhitelistStatus.DECLINED) {
      return unit.department;
    }

    return whitelistStatus.department;
  }

  return unit.department;
}

export function formatOfficerDepartment(unit: FullOfficer | FullDeputy) {
  if (!("whitelistStatus" in unit)) return getUnitDepartment(unit)?.value.value ?? null;

  const whitelistStatus = unit.whitelistStatus;
  const department = unit.department;

  if (whitelistStatus && whitelistStatus.status === WhitelistStatus.PENDING) {
    return `${department?.value.value} (${whitelistStatus.department.value.value})`;
  }

  return getUnitDepartment(unit)?.value.value ?? null;
}
