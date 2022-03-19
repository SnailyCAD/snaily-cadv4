import { getTranslations } from "../src/lib/getTranslation";
import { expect, test } from "vitest";

test("Should return translations for calls & admin in EN", async () => {
  expect(await getTranslations(["calls", "admin"], "en")).toBeTypeOf("object");
});

test("Should return translations for citizen in RU", async () => {
  expect(await getTranslations(["citizen"], "ru")).toBeTypeOf("object");
});
