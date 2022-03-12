import {
  ValueType,
  Value,
  VehicleValue,
  WeaponValue,
  StatusValue,
  DepartmentValue,
  DivisionValue,
  EmployeeValue,
  DriversLicenseCategoryValue,
  Officer,
  CombinedLeoUnit,
  EmsFdDeputy,
  PenalCode,
} from "@snailycad/types";

export type ValueWithValueObj =
  | VehicleValue
  | WeaponValue
  | StatusValue
  | DepartmentValue
  | DivisionValue
  | EmployeeValue
  | DriversLicenseCategoryValue;

export type AnyValue = Value<ValueType> | ValueWithValueObj | PenalCode;

export function isBaseValue(value: AnyValue): value is Value<ValueType> {
  return !isPenalCodeValue(value) && "createdAt" in value && typeof value.type === "string";
}

export function hasValueObj(value: AnyValue): value is ValueWithValueObj {
  return "value" in value && typeof value.value === "object";
}

export function isVehicleValue(value: AnyValue): value is VehicleValue {
  return hasValueObj(value) && value.value.type === ValueType.VEHICLE;
}

export function isWeaponValue(value: AnyValue): value is WeaponValue {
  return hasValueObj(value) && value.value.type === ValueType.WEAPON;
}

export function isStatusValue(value: AnyValue): value is StatusValue {
  return hasValueObj(value) && value.value.type === ValueType.CODES_10;
}

export function isDepartmentValue(value: AnyValue): value is DepartmentValue {
  return hasValueObj(value) && value.value.type === ValueType.DEPARTMENT;
}

export function isDivisionValue(value: AnyValue): value is DivisionValue {
  return hasValueObj(value) && value.value.type === ValueType.DIVISION;
}

export function isEmployeeValue(value: AnyValue): value is EmployeeValue {
  return hasValueObj(value) && value.value.type === ValueType.BUSINESS_ROLE;
}

export function isPenalCodeValue(value: AnyValue): value is PenalCode {
  return "title" in value && "warningApplicableId" in value;
}

export function isUnitCombined(
  unit: Officer | CombinedLeoUnit | EmsFdDeputy,
): unit is CombinedLeoUnit {
  return !("citizenId" in unit) || "officers" in unit;
}

export function isUnitOfficer(unit: Officer | CombinedLeoUnit | EmsFdDeputy): unit is Officer {
  return !isUnitCombined(unit) && "divisions" in unit && Array.isArray(unit.divisions);
}
