import { expect, it } from "vitest";
import { handleValidate } from "../src/lib/handleValidate";
import { AUTH_SCHEMA, LICENSE_SCHEMA } from "@snailycad/schemas";
import subDays from "date-fns/subDays";

it("Should correctly validate a CORRECT object, schema: AUTH_SCHEMA", () => {
  const data = {
    username: "CasperTheGhost",
    password: "hello@world212",
    registrationCode: "test-123",
  };

  expect(handleValidate(AUTH_SCHEMA)(data)).toMatchObject({});
});

it("Should correctly validate an INVALID object, schema: AUTH_SCHEMA", () => {
  const data = {
    username: "cannot_#have_special_characters@",
    password: "toshort",
    registrationCode: "test-123",
  };

  expect(handleValidate(AUTH_SCHEMA)(data)).toMatchInlineSnapshot(`
    {
      "password": "String must contain at least 8 character(s)",
    }
  `);
});

it("Should correctly validate an INVALID nested object, schema: LICENSE_SCHEMA", () => {
  const data = {
    driversLicense: "testing",
    pilotLicense: false,
    suspended: {
      driverLicense: true,
      driverLicenseTimeEnd: subDays(new Date(), 3),
      firearmsLicense: true,
      pilotLicense: true,
      waterLicense: false,
    },
  };

  expect(handleValidate(LICENSE_SCHEMA)(data)).toMatchInlineSnapshot(
    {
      suspended: {
        driverLicenseTimeEnd: expect.any(String),
      },
    },
    `
    {
      "pilotLicense": "Expected string, received boolean",
      "suspended": {
        "driverLicenseTimeEnd": Any<String>,
      },
    }
  `,
  );
});
