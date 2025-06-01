import { IMAGES_REGEX, allowedFileExtensions } from "../src/index";
import { test, expect } from "vitest";

const DISALLOWED_URL1 = "https://imgur.com/t/artcrawl/7CvDC3G";

test("URL must match IMAGES_REGEX", () => {
  expect(
    IMAGES_REGEX.test(
      "https://cdn.discordapp.com/attachments/968165951465984070/1013054845843947600/screenshot.jpg",
    ),
  ).toBe(true);
});

test(`URL must not match IMAGES_REGEX: ${DISALLOWED_URL1}`, () => {
  expect(IMAGES_REGEX.test(DISALLOWED_URL1)).toBe(false);
});

test("URL must match IMAGES_REGEX", () => {
  expect(IMAGES_REGEX.test("https://i.imgur.com/3yMqQbL.jpeg")).toBe(true);
});

test("Must include image/png in `allowedFileExtensions`", () => {
  expect(allowedFileExtensions.includes("image/png")).toBe(true);
});

test("Must not include video/mp4 in `allowedFileExtensions`", () => {
  // @ts-expect-error explicit for testing
  expect(allowedFileExtensions.includes("video/mp4")).toBe(false);
});
