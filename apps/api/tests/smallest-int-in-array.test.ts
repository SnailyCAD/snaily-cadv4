import { expect, test } from "vitest";
import { findFirstSmallestInArray } from "../src/utils/findFirstSmallestInArray";

const ARRAY_1 = [1, 5, 3, 2];
const ARRAY_2 = [1, 2, 3, 4, 10, 25, 32];

test("Should return smallest int in an array", () => {
  expect(findFirstSmallestInArray(ARRAY_1)).toBe(4);
});

test("Should return smallest int in an array", () => {
  expect(findFirstSmallestInArray(ARRAY_2)).toBe(5);
});
