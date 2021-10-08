import { readFile } from "node:fs/promises";
import path from "node:path";

const cwd = process.cwd();

export async function getTranslations(types: string[], locale = "en") {
  const paths = types.map((type) => path.join(cwd, `locales/${locale}/${type}.json`));

  let data = {};

  await Promise.all(
    paths.map(async (path) => {
      const json = JSON.parse(await readFile(path, "utf8"));
      data = { ...data, ...json };
    }),
  );

  return data;
}
