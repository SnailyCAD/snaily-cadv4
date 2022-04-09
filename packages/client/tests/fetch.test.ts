/* eslint-disable quotes */
import { expect, test } from "vitest";
import { handleRequest, findUrl } from "../src/lib/fetch";

test.fails("Should return error instance", async () => {
  expect(await handleRequest("/test-123")).toThrow();
});

test("Should find the correct development URL", () => {
  expect(findUrl()).toMatchInlineSnapshot('"http://localhost:8080/v1"');
});

test("Should find the correct development URL via Docker", () => {
  process.env.NEXT_PUBLIC_PROD_ORIGIN = "http://api:8080/v1";
  // @ts-expect-error testing purposes
  global.window = {};
  expect(findUrl()).toMatchInlineSnapshot('"http://localhost:8080/v1"');
});
