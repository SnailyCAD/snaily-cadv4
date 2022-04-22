import { IMGUR_REGEX, allowedFileExtensions } from "../src/index";
import { test, expect } from "vitest";

const ALLOWED_URL1 = "https://i.imgur.com/3yMqQbL.jpeg";
const DISALLOWED_URL1 = "https://imgur.com/t/artcrawl/7CvDC3G";
const DISALLOWED_URL2 = "https://i.imgur.com/taIbN7s.mp4";

test(`URL must match IMGUR_REGEX: ${ALLOWED_URL1}`, () => {
  expect(IMGUR_REGEX.test(ALLOWED_URL1)).toBe(true);
});

test(`URL must not match IMGUR_REGEX: ${DISALLOWED_URL1}`, () => {
  expect(IMGUR_REGEX.test(DISALLOWED_URL1)).toBe(false);
});

test(`URL must not match IMGUR_REGEX: ${DISALLOWED_URL2}`, () => {
  expect(IMGUR_REGEX.test(DISALLOWED_URL2)).toBe(false);
});

test("Must include image/png in `allowedFileExtensions`", () => {
  expect(allowedFileExtensions.includes("image/png")).toBe(true);
});

test("Must not include video/mp4 in `allowedFileExtensions`", () => {
  // @ts-expect-error explicit for testing
  expect(allowedFileExtensions.includes("video/mp4")).toBe(false);
});
