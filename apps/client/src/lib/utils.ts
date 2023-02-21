import {
  type Citizen,
  type CombinedLeoUnit,
  type Officer,
  type Value,
  type ValueLicenseType,
  WhitelistStatus,
  EmsFdDeputy,
  CombinedEmsFdUnit,
  Business,
} from "@snailycad/types";
import { isUnitCombined, isUnitCombinedEmsFd, isUnitOfficer } from "@snailycad/utils/typeguards";
import { handleRequest } from "./fetch";
import type { IncomingMessage } from "connect";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";
import format from "date-fns/format";
import differenceInYears from "date-fns/differenceInYears";
import type { Sounds } from "./server/getAvailableSounds.server";

export function calculateAge(dateOfBirth: string | Date): string {
  const difference = differenceInYears(new Date(), new Date(dateOfBirth));
  return String(difference);
}

type Config = [string, unknown?][];
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

export function makeUnitName(
  unit: Officer | EmsFdDeputy | CombinedLeoUnit | CombinedEmsFdUnit | undefined,
) {
  if (!unit) return "UNKNOWN";

  const isCombined = isUnitCombined(unit) || isUnitCombinedEmsFd(unit);
  if (isCombined) return "";

  return `${unit.citizen.name} ${unit.citizen.surname}`;
}

export function yesOrNoText(t: boolean): "yes" | "no" {
  return t ? "yes" : "no";
}

export function formatUnitDivisions(unit: Officer | EmsFdDeputy) {
  const division = isUnitOfficer(unit) ? null : unit.division?.value.value;
  if (!("divisions" in unit)) return division as string;
  const divisions = unit.divisions.map((d) => d.value.value).join(", ");

  return division ?? divisions;
}

export function formatCitizenAddress(data: Pick<Citizen | Business, "address" | "postal">) {
  const { address, postal } = data;
  return `${address}${postal ? ` (${postal})` : ""}`;
}

export function formatDate(date: string | Date | number, options?: { onlyDate: boolean }) {
  const dateObj = new Date(date);
  const hmsString = options?.onlyDate ? "" : " HH:mm:ss";
  return format(dateObj, `yyyy-MM-dd${hmsString}`);
}

export function filterLicenseTypes(licenses: Value[], type: ValueLicenseType) {
  return licenses.filter((item) => filterLicenseType(item, type));
}

export function filterLicenseType(value: Value, type: ValueLicenseType) {
  if (value.licenseType === null) return true;
  return value.licenseType === type;
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
    return `${department?.value.value} (${whitelistStatus.department?.value.value})`;
  }

  return getUnitDepartment(unit)?.value.value ?? null;
}

export function canUseThirdPartyConnections() {
  if (typeof window === "undefined") return true;
  return window.location === window.parent.location;
}

export function isUnitDisabled(unit: Officer | EmsFdDeputy) {
  if (unit.suspended) return true;
  if (!unit.whitelistStatus) return false;

  return (
    unit.whitelistStatus.status !== WhitelistStatus.ACCEPTED &&
    !unit.department?.isDefaultDepartment
  );
}

export function omit<Obj extends object, Properties extends keyof Obj>(
  obj: Obj,
  properties: Properties[],
): Omit<Obj, Properties> {
  const newObj = {} as Record<string, unknown>;
  const entries = Object.entries(obj);

  for (const [name, value] of entries) {
    if (properties.includes(name as Properties)) {
      continue;
    }

    newObj[name] = value;
  }

  return newObj as Omit<Obj, Properties>;
}

export function soundCamelCaseToKebabCase(sound: string) {
  const obj: Record<string, Sounds> = {
    panicButton: "panic-button",
    signal100: "signal100",
    addedToCall: "added-to-call",
    stopRoleplay: "stop-roleplay",
    statusUpdate: "status-update",
    incomingCall: "incoming-call",
  };

  return obj[sound] as Sounds;
}

export function isEmpty<Obj extends object>(obj: Obj) {
  return getObjLength(obj) === 0;
}

export function getObjLength<Obj extends object>(obj: Obj) {
  return Object.keys(obj).length;
}
