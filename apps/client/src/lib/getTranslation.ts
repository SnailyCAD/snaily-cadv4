import { readFile } from "node:fs/promises";
import path from "node:path";
import { getNextI18nConfig } from "./i18n/getNextI18nConfig";

const cwd = process.cwd();

export async function getTranslations(types: string[], locale = "en") {
  const typesWithCommon = [...new Set(["common", "auth", ...types])];
  const paths = typesWithCommon.map((type) => path.join(cwd, `locales/${locale}/${type}.json`));
  const i18n = await getNextI18nConfig();

  if (!i18n.locales.includes(locale)) {
    locale = i18n.defaultLocale;
  }

  let data = {};

  await Promise.all(
    paths.map(async (path) => {
      const json = JSON.parse(await readFile(path, "utf8"));
      data = { ...data, ...json };
    }),
  );

  return data;
}
