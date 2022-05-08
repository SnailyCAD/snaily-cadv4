import { expect, it } from "vitest";
import { handleValidate } from "../src/lib/handleValidate";
import { AUTH_SCHEMA } from "@snailycad/schemas";

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
      "username": "Invalid",
    }
  `);
});
