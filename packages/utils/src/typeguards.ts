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
  QualificationValue,
  CallTypeValue,
  PenalCode,
  AnyValue,
  ValueWithValueObj,
  AddressValue,
  EmergencyVehicleValue,
  CombinedEmsFdUnit,
} from "@snailycad/types";

export function isPenalCodeValue(value: AnyValue): value is PenalCode {
  return (
    "warningApplicableId" in value &&
    "warningNotApplicableId" in value &&
    "descriptionData" in value
  );
}

export function isBaseValue(value: AnyValue): value is Value {
  return !isPenalCodeValue(value) && "createdAt" in value && typeof value.type === "string";
}

export function hasValueObj(value: AnyValue): value is ValueWithValueObj {
  return !isPenalCodeValue(value) && "value" in value && typeof value.value === "object";
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

export function isUnitQualification(value: AnyValue): value is QualificationValue {
  return hasValueObj(value) && value.value.type === ValueType.QUALIFICATION;
}

export function isDLCategoryValue(value: AnyValue): value is DriversLicenseCategoryValue {
  return hasValueObj(value) && value.value.type === ValueType.DRIVERSLICENSE_CATEGORY;
}

export function isCallTypeValue(value: AnyValue): value is CallTypeValue {
  return hasValueObj(value) && value.value.type === ValueType.CALL_TYPE;
}

export function isAddressValue(value: AnyValue): value is AddressValue {
  return hasValueObj(value) && value.value.type === ValueType.ADDRESS;
}

export function isEmergencyVehicleValue(value: AnyValue): value is EmergencyVehicleValue {
  return hasValueObj(value) && value.value.type === ValueType.EMERGENCY_VEHICLE;
}

export function isOfficerRankValue(value: AnyValue): value is Value & { type: "OFFICER_RANK" } {
  return isBaseValue(value) && value.type === ValueType.OFFICER_RANK;
}

export function isUnitCombined(
  unit: Officer | CombinedEmsFdUnit | CombinedLeoUnit | EmsFdDeputy,
): unit is CombinedLeoUnit {
  return !("citizenId" in unit) && "officers" in unit;
}

export function isUnitCombinedEmsFd(
  unit: Officer | CombinedEmsFdUnit | CombinedLeoUnit | EmsFdDeputy,
): unit is CombinedEmsFdUnit {
  return !("citizenId" in unit) && "deputies" in unit;
}

export function isUnitOfficer(
  unit: Officer | CombinedEmsFdUnit | CombinedLeoUnit | EmsFdDeputy,
): unit is Officer {
  return !isUnitCombined(unit) && "divisions" in unit && Array.isArray(unit.divisions);
}
