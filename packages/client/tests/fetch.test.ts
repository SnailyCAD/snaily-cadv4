/* eslint-disable quotes */
import { expect, test } from "vitest";
import { handleRequest, findUrl } from "../src/lib/fetch";

test.todo("Should return 200 response");

test.fails("Should return error instance", async () => {
  expect(await handleRequest("/test-123")).toThrow();
});

test("Should find the correct development URL", () => {
  expect(findUrl()).toMatchInlineSnapshot('"http://localhost:8080/v1"');
});
