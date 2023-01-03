import { describe, expect, it } from "vitest";
import { normalizeValue } from "../src/lib/values/normalize-value";
import { ValueType } from "@snailycad/types";

const types = {
  license: ValueType.LICENSE,
  gender: ValueType.GENDER,
  ethnicity: ValueType.ETHNICITY,
  weapon: ValueType.WEAPON,
  bloodGroup: ValueType.BLOOD_GROUP,
  officerRank: ValueType.OFFICER_RANK,
  division: ValueType.DIVISION,
  businessRole: ValueType.BUSINESS_ROLE,
  codes10: ValueType.CODES_10,
  vehicle: ValueType.VEHICLE,
  vehicleFlag: ValueType.VEHICLE_FLAG,
  citizenFlag: ValueType.CITIZEN_FLAG,
  penalCode: ValueType.PENAL_CODE,
  department: ValueType.DEPARTMENT,
  driverslicenseCategory: ValueType.DRIVERSLICENSE_CATEGORY,
  impoundLot: ValueType.IMPOUND_LOT,
  qualification: ValueType.QUALIFICATION,
};

describe("Normalize the value types", () => {
  for (const type in types) {
    const key = type as keyof typeof types;

    it(`GIVEN: ${types[key]}, EXPECTED: ${key}`, () => {
      expect(normalizeValue(types[key])).toBe(key);
    });
  }
});
