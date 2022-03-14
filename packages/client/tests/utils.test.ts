/* eslint-disable quotes */
import { expect, test } from "vitest";
import { calculateAge, yesOrNoText } from "../src/lib/utils";

const DOB_1 = "1999-03-02";
const DOB_2 = "1953-10-21";

test("Should correctly calculate age", () => {
  expect(calculateAge(DOB_1)).toMatchInlineSnapshot('"23"');
});

test("Should correctly calculate age", () => {
  expect(calculateAge(DOB_2)).toMatchInlineSnapshot('"68"');
});

test("Should return 'yes' or 'no' -> yes", () => {
  expect(yesOrNoText(true)).toBe("yes");
});

test("Should return 'yes' or 'no' -> no", () => {
  expect(yesOrNoText(false)).toBe("no");
});
