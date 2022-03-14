import { getTranslations } from "../src/lib/getTranslation";
import { expect, test } from "vitest";

test("Should return translations for calls & admin in EN", async () => {
  expect(await getTranslations(["calls", "admin"], "en")).toMatchSnapshot();
});

test("Should return translations for citizen in RU", async () => {
  expect(await getTranslations(["citizen"], "ru")).toMatchSnapshot();
});
