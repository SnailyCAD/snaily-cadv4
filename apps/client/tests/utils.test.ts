/* eslint-disable quotes */
import { ValueLicenseType, WhitelistStatus } from "@snailycad/types";
import { describe, expect, test } from "vitest";
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
  filterLicenseTypes,
  canUseThirdPartyConnections,
  isUnitDisabled,
  omit,
  isEmpty,
  getObjLength,
  soundCamelCaseToKebabCase,
} from "../src/lib/utils";

const DOB_1 = "1999-03-02";
const DOB_2 = "1953-10-21";

describe("calculateAge", () => {
  test("Should correctly calculate age", () => {
    expect(calculateAge(DOB_1)).toMatchInlineSnapshot('"24"');
  });

  test("Should correctly calculate age", () => {
    expect(calculateAge(DOB_2)).toMatchInlineSnapshot('"69"');
  });
});

describe("yesOrNoText", () => {
  test("Should return 'yes' -> true", () => {
    expect(yesOrNoText(true)).toBe("yes");
  });

  test("Should return  'no' -> false", () => {
    expect(yesOrNoText(false)).toBe("no");
  });
});

describe("formatDate", () => {
  const TEST_DATE = new Date("2010-10-10 20:03:02");
  test("Should format a date with seconds", () => {
    expect(formatDate(TEST_DATE)).toMatchInlineSnapshot('"2010-10-10 20:03:02"');
  });

  test("Should format a date without seconds", () => {
    expect(formatDate(TEST_DATE, { onlyDate: true })).toMatchInlineSnapshot('"2010-10-10"');
  });
});

describe("formatCitizenAddress", () => {
  const TEST_CITIZEN = {
    address: "Great Ocean Highway",
    postal: "3900",
  } as any;

  test("Should return the address a citizen with postal", () => {
    expect(formatCitizenAddress(TEST_CITIZEN)).toMatchInlineSnapshot(
      '"Great Ocean Highway (3900)"',
    );
  });

  test("Should return the address a citizen without postal", () => {
    delete TEST_CITIZEN.postal;
    expect(formatCitizenAddress(TEST_CITIZEN)).toMatchInlineSnapshot('"Great Ocean Highway"');
  });
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

const TEST_EMS_FD_DEPUTY = {
  callsign: "E",
  callsign2: "92",
  citizen: { name: "jane", surname: "doe" },
  badgeNumber: 6034,
  department: { value: { value: "Fire" }, callsign: "A" },
  division: { value: { value: "Patrol" }, callsign: "P" },
  citizenId: "xxxxx",
} as any;

describe("formatUnitDivisions", () => {
  test("Should correctly format an officer's divisions", () => {
    expect(formatUnitDivisions(TEST_OFFICER)).toMatchInlineSnapshot('"Patrol, Swat"');
  });

  test("Should correctly format an EMS/FD deputy division", () => {
    expect(formatUnitDivisions(TEST_EMS_FD_DEPUTY)).toMatchInlineSnapshot('"Patrol"');
  });
});

describe("makeUnitName", () => {
  test("Should format an officers' name", () => {
    expect(makeUnitName(TEST_OFFICER)).toMatch("john doe");
  });

  test("Should format an EMS/FD deputy name", () => {
    expect(makeUnitName(TEST_EMS_FD_DEPUTY)).toMatch("jane doe");
  });

  test("Should not format a combined unit's name", () => {
    expect(makeUnitName({ officers: [] } as any)).toMatch("");
  });
});

describe("getUnitDepartment", () => {
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
});

describe("formatOfficerDepartment", () => {
  test("Should format unit department -> TEST_EMS_FD_DEPUTY", () => {
    expect(formatOfficerDepartment(TEST_EMS_FD_DEPUTY)).toMatchInlineSnapshot('"Fire"');
  });

  test("Should return null if the department is null -> TEST_EMS_FD_DEPUTY", () => {
    delete TEST_EMS_FD_DEPUTY.department;

    expect(formatOfficerDepartment(TEST_EMS_FD_DEPUTY)).toBe(null);
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

describe("filterLicenseTypes", () => {
  const TEST_VALUES = [
    { licenseType: ValueLicenseType.LICENSE },
    { licenseType: ValueLicenseType.INSURANCE_STATUS },
    { licenseType: ValueLicenseType.REGISTRATION_STATUS },
    { licenseType: ValueLicenseType.LICENSE },
    { licenseType: ValueLicenseType.REGISTRATION_STATUS },
    { licenseType: null },
  ] as any;

  test("Should filter license types -> LICENSE", () => {
    expect(filterLicenseTypes(TEST_VALUES, ValueLicenseType.LICENSE)).toMatchInlineSnapshot(`
      [
        {
          "licenseType": "LICENSE",
        },
        {
          "licenseType": "LICENSE",
        },
        {
          "licenseType": null,
        },
      ]
    `);
  });

  test("Should filter license types -> REGISTRATION_STATUS", () => {
    expect(filterLicenseTypes(TEST_VALUES, ValueLicenseType.REGISTRATION_STATUS))
      .toMatchInlineSnapshot(`
      [
        {
          "licenseType": "REGISTRATION_STATUS",
        },
        {
          "licenseType": "REGISTRATION_STATUS",
        },
        {
          "licenseType": null,
        },
      ]
    `);
  });

  test("Should filter license types -> INSURANCE_STATUS", () => {
    expect(filterLicenseTypes(TEST_VALUES, ValueLicenseType.INSURANCE_STATUS))
      .toMatchInlineSnapshot(`
      [
        {
          "licenseType": "INSURANCE_STATUS",
        },
        {
          "licenseType": null,
        },
      ]
    `);
  });
});

describe("canUseThirdPartyConnections", () => {
  test("Should handle Discord auth -> window not defined", () => {
    expect(canUseThirdPartyConnections()).toBe(true);
  });

  test("Should handle Discord auth -> window defined", () => {
    // @ts-expect-error testing purposes
    global.window = { location: "test", parent: { location: "test" } };
    expect(canUseThirdPartyConnections()).toBe(true);
  });

  test("Should handle Discord auth -> window defined -> incorrect location", () => {
    // @ts-expect-error testing purposes
    global.window = { location: "test", parent: { location: "different location" } };
    expect(canUseThirdPartyConnections()).toBe(false);
  });
});

describe("isUnitDisabled", () => {
  test("should return `true` if the unit is suspended", () => {
    expect(isUnitDisabled({ whitelistStatus: null, suspended: true } as any)).toBe(true);
  });

  test("should return `false` if the unit is NOT suspended", () => {
    expect(isUnitDisabled({ whitelistStatus: null, suspended: false } as any)).toBe(false);
  });

  test("should return `true` if the unit is PENDING access", () => {
    TEST_OFFICER.whitelistStatus = { status: WhitelistStatus.PENDING };

    expect(isUnitDisabled(TEST_OFFICER)).toBe(true);
  });

  test("should return `false` if the unit is ACCEPTED", () => {
    TEST_OFFICER.whitelistStatus = { status: WhitelistStatus.ACCEPTED };

    expect(isUnitDisabled(TEST_OFFICER)).toBe(false);
  });
});

test("Should correctly omit values from an object", () => {
  const myObj = { a: 1, b: 2, c: 3, d: 4 };

  expect(omit(myObj, ["a", "d"])).toMatchObject({ b: 2, c: 3 });
});

describe("isEmpty", () => {
  test("Object should be empty", () => {
    expect(isEmpty({})).toBe(true);
  });

  test("Object should NOT be empty", () => {
    expect(isEmpty({ a: true, c: true, b: true })).toBe(false);
  });
});

describe("getObjLength", () => {
  test("Object keys length should be 3", () => {
    expect(getObjLength({ a: true, c: true, b: true })).toBe(3);
  });

  test("Object keys length should be 0", () => {
    expect(getObjLength({})).toBe(0);
  });
});

describe("soundCamelCaseToKebabCase", () => {
  test("it should correctly convert a camel case string to kebab case", () => {
    expect(soundCamelCaseToKebabCase("panicButton")).toBe("panic-button");
    expect(soundCamelCaseToKebabCase("signal100")).toBe("signal100");
    expect(soundCamelCaseToKebabCase("addedToCall")).toBe("added-to-call");
  });
});
