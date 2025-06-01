import { expect, test } from "vitest";
import { getCADVersion } from "../src/version";

test("Should return the CAD version", async () => {
  expect(await getCADVersion()).toBeTypeOf("object");
});
