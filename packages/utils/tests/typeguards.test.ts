import { expect, test } from "vitest";
import { Value, ValueType } from "@snailycad/types";
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
