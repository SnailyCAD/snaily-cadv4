/* eslint-disable quotes */
import { expect, test } from "vitest";
import { handleRequest, findAPIUrl } from "../src/lib/fetch";

test.fails("Should return error instance", async () => {
  expect(await handleRequest("/test-123")).toThrow();
});

test("Should find the correct development URL", () => {
  expect(findAPIUrl()).toMatchInlineSnapshot('"http://localhost:8080/v1"');
});
