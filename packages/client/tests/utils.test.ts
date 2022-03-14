/* eslint-disable quotes */
import { expect, test } from "vitest";
import {
  calculateAge,
  yesOrNoText,
  formatDate,
  formatCitizenAddress,
  formatUnitDivisions,
  makeUnitName,
  getUnitDepartment,
  formatOfficerDepartment,
  requestAll,
} from "../src/lib/utils";

const DOB_1 = "1999-03-02";
const DOB_2 = "1953-10-21";

test("Should correctly calculate age", () => {
  expect(calculateAge(DOB_1)).toMatchInlineSnapshot('"23"');
});

test("Should correctly calculate age", () => {
  expect(calculateAge(DOB_2)).toMatchInlineSnapshot('"68"');
});

test("Should return 'yes' -> true", () => {
  expect(yesOrNoText(true)).toBe("yes");
});

test("Should return  'no' -> false", () => {
  expect(yesOrNoText(false)).toBe("no");
});

const TEST_DATE = new Date("2010-10-10 20:03:02");
test("Should format a date with seconds", () => {
  expect(formatDate(TEST_DATE)).toMatchInlineSnapshot('"2010-10-10 20:03:02"');
});

test("Should format a date without seconds", () => {
  expect(formatDate(TEST_DATE, { onlyDate: true })).toMatchInlineSnapshot('"2010-10-10"');
});

const TEST_CITIZEN = {
  address: "Great Ocean Highway",
  postal: "3900",
} as any;

test("Should return the address a citizen with postal", () => {
  expect(formatCitizenAddress(TEST_CITIZEN)).toMatchInlineSnapshot('"Great Ocean Highway (3900)"');
});

test("Should return the address a citizen without postal", () => {
  delete TEST_CITIZEN.postal;
  expect(formatCitizenAddress(TEST_CITIZEN)).toMatchInlineSnapshot('"Great Ocean Highway"');
});

const TEST_OFFICER = {
  callsign: "E",
  callsign2: "92",
  citizen: { name: "john", surname: "doe" },
  badgeNumber: 6034,
  department: { value: { value: "LSPD" }, callsign: "A" },
  divisions: [
    { value: { value: "Patrol" }, callsign: "P" },
    { value: { value: "Swat" }, callsign: "Swat" },
  ],
  citizenId: "xxxxx",
} as any;

export const TEST_EMS_FD_DEPUTY = {
  callsign: "E",
  callsign2: "92",
  citizen: { name: "jane", surname: "doe" },
  badgeNumber: 6034,
  department: { value: { value: "Fire" }, callsign: "A" },
  division: { value: { value: "Patrol" }, callsign: "P" },
  citizenId: "xxxxx",
} as any;

test("Should correctly format an officer's divisions", () => {
  expect(formatUnitDivisions(TEST_OFFICER)).toMatchInlineSnapshot('"Patrol, Swat"');
});

test("Should correctly format an EMS/FD deputy division", () => {
  expect(formatUnitDivisions(TEST_EMS_FD_DEPUTY)).toMatchInlineSnapshot('"Patrol"');
});

test("Should format an officers' name", () => {
  expect(makeUnitName(TEST_OFFICER)).toMatch("john doe");
});

test("Should format an EMS/FD deputy name", () => {
  expect(makeUnitName(TEST_EMS_FD_DEPUTY)).toMatch("jane doe");
});

test("Should return unit department -> null", () => {
  expect(getUnitDepartment(null)).toBe(null);
});

test("Should return unit department -> TEST_OFFICER", () => {
  expect(getUnitDepartment(TEST_OFFICER)).toMatchInlineSnapshot(`
    {
      "callsign": "A",
      "value": {
        "value": "LSPD",
      },
    }
  `);
});

test("Should return unit department -> TEST_OFFICER & whitelisted department PENDING", () => {
  TEST_OFFICER.whitelistStatus = {
    status: "PENDING",
    department: { callsign: "B", value: { value: "Trainee" } },
  };

  expect(getUnitDepartment(TEST_OFFICER)).toMatchInlineSnapshot(`
    {
      "callsign": "B",
      "value": {
        "value": "Trainee",
      },
    }
  `);
});

test("Should return unit department -> TEST_OFFICER & whitelisted department DECLINED", () => {
  TEST_OFFICER.whitelistStatus = {
    status: "DECLINED",
    department: { callsign: "B", value: { value: "Trainee" } },
  };

  expect(getUnitDepartment(TEST_OFFICER)).toMatchInlineSnapshot(`
    {
      "callsign": "A",
      "value": {
        "value": "LSPD",
      },
    }
  `);
});

test("Should return unit department -> TEST_EMS_FD_DEPUTY", () => {
  expect(getUnitDepartment(TEST_EMS_FD_DEPUTY)).toMatchInlineSnapshot(`
    {
      "callsign": "A",
      "value": {
        "value": "Fire",
      },
    }
  `);
});

test("Should format unit department -> TEST_EMS_FD_DEPUTY", () => {
  expect(formatOfficerDepartment(TEST_EMS_FD_DEPUTY)).toMatchInlineSnapshot('"Fire"');
});

test("Should format unit department -> TEST_OFFICER", () => {
  expect(formatOfficerDepartment(TEST_OFFICER)).toMatchInlineSnapshot('"LSPD"');
});

test("Should format unit department -> TEST_OFFICER & whitelist status", () => {
  TEST_OFFICER.whitelistStatus = {
    status: "PENDING",
    department: { callsign: "B", value: { value: "Trainee" } },
  };

  expect(formatOfficerDepartment(TEST_OFFICER)).toMatchInlineSnapshot('"LSPD (Trainee)"');
});

test("Should return defaultValue for requestAll", async () => {
  expect(await requestAll({} as any, [["/test", { officers: [], incidents: [] }]]))
    .toMatchInlineSnapshot(`
    [
      {
        "incidents": [],
        "officers": [],
      },
    ]
  `);
});
