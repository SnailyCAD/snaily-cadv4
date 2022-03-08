import { expect, test } from "vitest";
import { Officer, Value, ValueType, VehicleValue, WeaponValue } from "@snailycad/types";
import * as typeguards from "../src/typeguards";

const VEHICLE_VALUE = {
  value: { value: "Volvo XC90", type: ValueType.VEHICLE },
} as VehicleValue;

const WEAPON_VALUE = {
  value: { value: "Volvo XC90", type: ValueType.WEAPON },
} as WeaponValue;

const LICENSE_VALUE = {
  type: ValueType.LICENSE,
  value: "Valid",
  createdAt: new Date(),
} as Value<ValueType.LICENSE>;

const OFFICER = {
  callsign: "A",
  callsign2: "18",
  divisions: [],
  citizenId: "1234567890",
} as unknown as Officer;

test("typeguards.hasValueObj -> VEHICLE_VALUE", () => {
  expect(typeguards.hasValueObj(VEHICLE_VALUE)).eq(true);
});

test("typeguards.hasValueObj -> LICENSE_VALUE", () => {
  expect(typeguards.hasValueObj(LICENSE_VALUE)).eq(false);
});

test("typeguards.isBaseValue -> LICENSE_VALUE -> true", () => {
  expect(typeguards.isBaseValue(LICENSE_VALUE)).eq(true);
});

test("typeguards.isBaseValue -> VEHICLE_VALUE -> false", () => {
  expect(typeguards.isBaseValue(VEHICLE_VALUE)).eq(false);
});

test("typeguards.isVehicleValue -> VEHICLE_VALUE -> true", () => {
  expect(typeguards.isVehicleValue(VEHICLE_VALUE)).eq(true);
});

test("typeguards.isVehicleValue -> LICENSE_VALUE -> false", () => {
  expect(typeguards.isVehicleValue(LICENSE_VALUE)).eq(false);
});

test("typeguards.isWeaponValue -> WEAPON_VALUE -> true", () => {
  expect(typeguards.isWeaponValue(WEAPON_VALUE)).eq(true);
});

test("typeguards.isUnitOfficer -> OFFICER -> true", () => {
  expect(typeguards.isUnitOfficer(OFFICER)).eq(true);
});
