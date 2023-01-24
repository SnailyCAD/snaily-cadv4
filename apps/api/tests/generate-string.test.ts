import { expect, test } from "vitest";
import { generateString } from "../src/utils/generate-string";

test("Should generate a random string, with numbers", () => {
  const LENGTH = 17;
  const RESULT = generateString(LENGTH);

  expect(RESULT).toHaveLength(LENGTH);
});

test("Should generate a random string, numbers only", () => {
  const LENGTH = 9;
  const RESULT = generateString(LENGTH, { numbersOnly: true });

  expect(RESULT).toHaveLength(LENGTH);
  expect(isNaN(Number(RESULT))).toBe(false); // parse the string as number -> should be a valid number
});
