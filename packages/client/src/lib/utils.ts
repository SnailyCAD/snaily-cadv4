import {
  type Citizen,
  type CombinedLeoUnit,
  type Officer,
  type Value,
  type ValueLicenseType,
  WhitelistStatus,
  ValueType,
  EmsFdDeputy,
} from "@snailycad/types";
import { isUnitCombined, isUnitOfficer } from "@snailycad/utils/typeguards";
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

type Config = [string, any?][];
export async function requestAll(
  req: IncomingMessage & { cookies?: NextApiRequestCookies },
  config: Config,
) {
  return Promise.all(
    config.map(async ([path, defaultValue = {}]) => {
      return handleRequest(path, {
        req,
        isSsr: true,
      })
        .then((v) => (typeof v.data === "undefined" ? defaultValue : v.data))
        .catch(() => defaultValue);
    }),
  );
}

export function makeUnitName(unit: Officer | EmsFdDeputy | CombinedLeoUnit) {
  if (isUnitCombined(unit)) return "";

  return `${unit.citizen.name} ${unit.citizen.surname}`;
}

export function yesOrNoText(t: boolean): "yes" | "no" {
  return t ? "yes" : "no";
}

export function formatUnitDivisions(unit: Officer | EmsFdDeputy) {
  const division = isUnitOfficer(unit) ? null : unit.division.value.value;
  if (!("divisions" in unit)) return division as string;
  const divisions = unit.divisions.map((d) => d.value.value).join(", ");

  return division ?? divisions;
}

export function formatCitizenAddress(citizen: Pick<Citizen, "address" | "postal">) {
  const { address, postal } = citizen;
  return `${address}${postal ? ` (${postal})` : ""}`;
}

export function formatDate(date: string | Date | number, options?: { onlyDate: boolean }) {
  const dateObj = new Date(date);
  const hmsString = options?.onlyDate ? "" : " HH:mm:ss";
  return format(dateObj, `yyyy-MM-dd${hmsString}`);
}

export function filterLicenseTypes(licenses: Value<ValueType.LICENSE>[], type: ValueLicenseType) {
  return licenses.filter((item) => {
    if (item.licenseType === null) return true;
    return item.licenseType === type;
  });
}

export function getUnitDepartment(unit: Officer | EmsFdDeputy | null) {
  if (!unit) return null;

  const whitelistStatus = isUnitOfficer(unit) ? unit.whitelistStatus : null;

  if (whitelistStatus) {
    if (whitelistStatus.status === WhitelistStatus.DECLINED) {
      return unit.department;
    }

    return whitelistStatus.department;
  }

  return unit.department;
}

export function formatOfficerDepartment(unit: Officer | EmsFdDeputy) {
  const whitelistStatus = unit.whitelistStatus;
  const department = unit.department;

  if (whitelistStatus && whitelistStatus.status === WhitelistStatus.PENDING) {
    return `${department?.value.value} (${whitelistStatus.department.value.value})`;
  }

  return getUnitDepartment(unit)?.value.value ?? null;
}

export function canUseThirdPartyConnections() {
  return typeof window !== "undefined" && window.location === window.parent.location;
}

export function isUnitDisabled(unit: Officer | EmsFdDeputy) {
  if (unit.suspended) return true;
  if (!unit.whitelistStatus) return false;

  return (
    unit.whitelistStatus.status !== WhitelistStatus.ACCEPTED &&
    !unit.department?.isDefaultDepartment
  );
}
