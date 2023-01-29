import { expect, test } from "vitest";
import { generateString } from "../src/utils/generate-string";

test("Should generate a random string, with numbers", () => {
  const LENGTH = 17;
  const RESULT = generateString(LENGTH);

  expect(RESULT).toHaveLength(LENGTH);
});

test("Should generate a random string, numbers only", () => {
  const LENGTH = 9;
  const RESULT = generateString(LENGTH, { type: "numbers-only" });

  expect(RESULT).toHaveLength(LENGTH);
  expect(parseInt(RESULT, 10)).toBeTypeOf("number");
});
