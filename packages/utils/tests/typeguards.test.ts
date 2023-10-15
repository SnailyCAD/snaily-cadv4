import { expect, test } from "vitest";
import { type Value, ValueType } from "@snailycad/types";
import * as typeguards from "../src/typeguards";
import { OFFICER, COMBINED_UNIT, EMS_FD_DEPUTY } from "./callsign.test";

const VEHICLE_VALUE = {
  value: { value: "Volvo XC90", type: ValueType.VEHICLE },
} as any;

const WEAPON_VALUE = {
  value: { value: "Volvo XC90", type: ValueType.WEAPON },
} as any;

const STATUS_VALUE = {
  value: { value: "10-8", type: ValueType.CODES_10 },
} as any;

const DEPARTMENT_VALUE = {
  value: { value: "Los Santos Police Department", type: ValueType.DEPARTMENT },
} as any;

const DIVISION_VALUE = {
  value: { value: "Patrol", type: ValueType.DIVISION },
} as any;

const EMPLOYEE_VALUE = {
  value: { value: "Owner", type: ValueType.BUSINESS_ROLE },
} as any;

const LICENSE_VALUE = {
  type: ValueType.LICENSE,
  value: "Valid",
  createdAt: new Date(),
} as Value;

const QUALIFICATION_VALUE = {
  value: { value: "Basic life support qualification", type: ValueType.QUALIFICATION },
} as any;

const DL_CATEGORY = {
  value: { value: "A", type: ValueType.DRIVERSLICENSE_CATEGORY },
} as any;

const OFFICER_RANK = {
  value: "Officer",
  type: ValueType.OFFICER_RANK,
  createdAt: new Date(),
} as any;

const PENAL_CODE = {
  title: "Hello world",
  descriptionData: "Hello world",
  warningApplicableId: null,
  warningNotApplicableId: "123",
} as any;

const CALL_TYPE = {
  value: { value: "Traffic stop", type: ValueType.CALL_TYPE },
} as any;

const EMERGENCY_VEHICLE = {
  value: { value: "Police Cruiser", type: ValueType.EMERGENCY_VEHICLE },
} as any;

const ADDRESS_VALUE = {
  value: { value: "123 Main Street", type: ValueType.ADDRESS },
} as any;

const COMBINED_EMS_FD_UNIT = {
  callsign: OFFICER.callsign,
  callsign2: OFFICER.callsign2,
  department: OFFICER.department,
  division: OFFICER.division,
  deputies: [OFFICER],
} as any;

test("typeguards.hasValueObj -> VEHICLE_VALUE", () => {
  expect(typeguards.hasValueObj(VEHICLE_VALUE)).toBe(true);
});

test("typeguards.hasValueObj -> LICENSE_VALUE", () => {
  expect(typeguards.hasValueObj(LICENSE_VALUE)).toBe(false);
});

test("typeguards.isBaseValue -> LICENSE_VALUE -> true", () => {
  expect(typeguards.isBaseValue(LICENSE_VALUE)).toBe(true);
});

test("typeguards.isBaseValue -> VEHICLE_VALUE -> false", () => {
  expect(typeguards.isBaseValue(VEHICLE_VALUE)).toBe(false);
});

test("typeguards.isVehicleValue -> VEHICLE_VALUE -> true", () => {
  expect(typeguards.isVehicleValue(VEHICLE_VALUE)).toBe(true);
});

test("typeguards.isVehicleValue -> LICENSE_VALUE -> false", () => {
  expect(typeguards.isVehicleValue(LICENSE_VALUE)).toBe(false);
});

test("typeguards.isWeaponValue -> WEAPON_VALUE -> true", () => {
  expect(typeguards.isWeaponValue(WEAPON_VALUE)).toBe(true);
});

test("typeguards.isStatusValue -> STATUS_VALUE -> true", () => {
  expect(typeguards.isStatusValue(STATUS_VALUE)).toBe(true);
});

test("typeguards.isDepartmentValue -> DEPARTMENT_VALUE -> true", () => {
  expect(typeguards.isDepartmentValue(DEPARTMENT_VALUE)).toBe(true);
});

test("typeguards.isDivisionValue -> DIVISION_VALUE -> true", () => {
  expect(typeguards.isDivisionValue(DIVISION_VALUE)).toBe(true);
});

test("typeguards.isEmployeeValue -> EMPLOYEE_VALUE -> true", () => {
  expect(typeguards.isEmployeeValue(EMPLOYEE_VALUE)).toBe(true);
});

test("typeguards.isUnitQualification -> QUALIFICATION_VALUE -> true", () => {
  expect(typeguards.isUnitQualification(QUALIFICATION_VALUE)).toBe(true);
});

test("typeguards.isDLCategoryValue -> DL_CATEGORY -> true", () => {
  expect(typeguards.isDLCategoryValue(DL_CATEGORY)).toBe(true);
});

test("typeguards.isOfficerRankValue -> OFFICER_RANK -> true", () => {
  expect(typeguards.isOfficerRankValue(OFFICER_RANK)).toBe(true);
});

test("typeguards.isPenalCodeValue -> PENAL_CODE -> true", () => {
  expect(typeguards.isPenalCodeValue(PENAL_CODE)).toBe(true);
});

test("typeguards.isCallTypeValue -> CALL_TYPE -> true", () => {
  expect(typeguards.isCallTypeValue(CALL_TYPE)).toBe(true);
});

test("typeguards.isEmergencyVehicleValue -> EMERGENCY_VEHICLE -> true", () => {
  expect(typeguards.isEmergencyVehicleValue(EMERGENCY_VEHICLE)).toBe(true);
});

test("typeguards.isAddressValue -> ADDRESS_VALUE -> true", () => {
  expect(typeguards.isAddressValue(ADDRESS_VALUE)).toBe(true);
});

test("typeguards.isUnitOfficer -> OFFICER -> true", () => {
  expect(typeguards.isUnitOfficer(OFFICER)).toBe(true);
});

test("typeguards.isUnitOfficer -> COMBINED_UNIT -> false", () => {
  expect(typeguards.isUnitOfficer(COMBINED_UNIT)).toBe(false);
});

test("typeguards.isUnitOfficer -> EMS_FD_DEPUTY -> false", () => {
  expect(typeguards.isUnitOfficer(EMS_FD_DEPUTY)).toBe(false);
});

test("typeguards.isUnitCombined -> COMBINED_UNIT -> true", () => {
  expect(typeguards.isUnitCombined(COMBINED_UNIT)).toBe(true);
});

test("typeguards.isUnitCombinedEmsFd -> COMBINED_EMS_FD_UNIT -> true", () => {
  expect(typeguards.isUnitCombinedEmsFd(COMBINED_EMS_FD_UNIT)).toBe(true);
});
