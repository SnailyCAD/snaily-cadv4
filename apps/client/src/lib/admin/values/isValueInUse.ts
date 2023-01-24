import type { AnyValue, ValueType } from "@snailycad/types";
import { hasValueObj, isBaseValue, isPenalCodeValue } from "@snailycad/utils";

const USED_COUNT_NAMES_PER_TYPE: Partial<Record<ValueType, string[]>> = {
  BLOOD_GROUP: ["MedicalRecord"],
  BUSINESS_ROLE: ["employees"],
  CITIZEN_FLAG: ["citizenFlags"],
  DEPARTMENT: ["Officer", "EmsFdDeputy", "Qualification", "CombinedLeoUnit", "LeoWhitelistStatus"],
  DIVISION: ["deputies", "officers", "officerDivisionsToDivision"],
  ETHNICITY: ["ethnicityToValue"],
  GENDER: ["genderToValue"],
  IMPOUND_LOT: ["ImpoundedVehicle"],
  LICENSE: [
    "registrationStatusToValue",
    "insuranceStatusToValue",
    "pilotLicenseToValue",
    "weaponLicenseToValue",
    "waterLicenseToValue",
    "driversLicenseToValue",
    "weaponExamToLicense",
    "dlExamToLicense",
  ],
  OFFICER_RANK: ["officerRankDepartments"],
  QUALIFICATION: ["UnitQualification"],
  VEHICLE: ["RegisteredVehicle"],
  WEAPON: ["weapon", "weaponModelToValue"],

  VEHICLE_FLAG: ["vehicleFlags"],
  ADDRESS_FLAG: ["addressFlags"],
};

export function isValueInUse(value: AnyValue) {
  const isBase = isBaseValue(value);
  const hasObj = hasValueObj(value);

  if (isPenalCodeValue(value)) {
    return false;
  }

  const baseCounts = isBase ? value._count : value.value._count;
  const objCounts = hasObj ? value._count : {};

  const counts = { ...baseCounts, ...objCounts } as Record<string, number>;
  const valueType = isBase ? value.type : hasObj ? value.value.type : null;
  if (!valueType) return false;

  const keys = USED_COUNT_NAMES_PER_TYPE[valueType];
  if (!keys) return false;

  for (const _key of keys) {
    const amount = counts[_key] ?? 0;

    if (amount >= 1) {
      return true;
    }
  }

  return false;
}
