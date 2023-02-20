import { expect, test } from "vitest";
import { generateString, LETTERS, NUMBERS } from "../src/utils/generate-string";

test("Should generate a random string, with numbers and letters", () => {
  const LENGTH = 17;
  const RESULT = generateString(LENGTH);

  expect(RESULT).contains.any.keys(...LETTERS, ...NUMBERS);
  expect(RESULT).toHaveLength(LENGTH);
});

test("Should generate a random string, numbers only", () => {
  const LENGTH = 9;
  const RESULT = generateString(LENGTH, { type: "numbers-only" });

  expect(RESULT).toHaveLength(LENGTH);
  expect(parseInt(RESULT, 10)).toBeTypeOf("number");
});

test("Should generate a random string, letters only", () => {
  const LENGTH = 9;
  const RESULT = generateString(LENGTH, { type: "letters-only" });

  expect(RESULT).toHaveLength(LENGTH);
  expect(RESULT).toBeTypeOf("string");
});
