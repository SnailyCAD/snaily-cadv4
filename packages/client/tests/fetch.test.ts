import { expect, test } from "vitest";
import { handleRequest } from "../src/lib/fetch";

test.todo("Should return 200 response");

test.fails("Should return error instance", async () => {
  expect(await handleRequest("/test-123")).toThrow();
});
