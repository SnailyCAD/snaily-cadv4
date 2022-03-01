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
} from "@snailycad/types";

export type ValueWithValueObj =
  | VehicleValue
  | WeaponValue
  | StatusValue
  | DepartmentValue
  | DivisionValue
  | EmployeeValue
  | DriversLicenseCategoryValue;

export type AnyValue = Value<ValueType> | ValueWithValueObj;

export function isBaseValue(value: AnyValue): value is Value<ValueType> {
  return "createdAt" in value && typeof value.type === "string";
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
