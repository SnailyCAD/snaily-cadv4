/* eslint-disable quotes */
import { describe, expect, test } from "vitest";
import { formatCaseNumber } from "../src/case-number";
import { prefixNumber } from "../src/utils/prefix-number";

// simple test data
export const OFFICER = {
  callsign: "E",
  callsign2: "92",
  citizen: { name: "john", surname: "doe" },
  badgeNumber: 6034,
  department: { value: { value: "LSPD" }, callsign: "PD" },
  divisions: [{ value: { value: "Patrol" }, callsign: "P" }],
  citizenId: "xxxxx",
} as any;

const RECORD = {
  caseNumber: 320,
  createdAt: "2022-12-20",
  officer: OFFICER,
} as any;

const TEMPLATE_WITH_YEAR = "{year}-{month}-{day}-{id}";
const TEMPLATE_WITH_YEAR_DEPARTMENT = "{department}-{year}-{month}-{day}-{id}";

describe("formatCaseNumber", () => {
  test(`should format record caseNumber with template: ${TEMPLATE_WITH_YEAR}`, () => {
    expect(formatCaseNumber(RECORD, TEMPLATE_WITH_YEAR)).toMatchInlineSnapshot(
      '"2022-12-20-00320"',
    );
  });

  test(`should format record caseNumber with template: ${TEMPLATE_WITH_YEAR_DEPARTMENT}`, () => {
    expect(formatCaseNumber(RECORD, TEMPLATE_WITH_YEAR_DEPARTMENT)).toMatchInlineSnapshot(
      '"PD-2022-12-20-00320"',
    );
  });
});

describe("prefixNumber", () => {
  test("should prefix caseNumber id with 0's - depth: 4", () => {
    expect(prefixNumber(20, 4)).toMatchInlineSnapshot('"0020"');
  });

  test("should prefix caseNumber id with 0's - depth 3", () => {
    expect(prefixNumber(300, 3)).toMatchInlineSnapshot('"300"');
  });

  test("should prefix caseNumber id with 0's - depth 6", () => {
    expect(prefixNumber(1, 6)).toMatchInlineSnapshot('"000001"');
  });

  test("should prefix caseNumber id with same length", () => {
    expect(prefixNumber(99_999, 5)).toMatchInlineSnapshot('"99999"');
  });

  test("should prefix caseNumber id with same longer length", () => {
    expect(prefixNumber(999_999, 5)).toMatchInlineSnapshot('"999999"');
  });

  test("should prefix caseNumber id with same less than 0", () => {
    expect(prefixNumber(999_999, 0)).toMatchInlineSnapshot('"999999"');
  });
});
