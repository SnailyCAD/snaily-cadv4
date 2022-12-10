import "dotenv/config";
import process from "node:process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile } from "node:fs/promises";

const UNIX_SLASHES_REGEX = /\/apps\/client/;
const WIN_SLASHES_REGEX = /\\apps\\client/;

function getClientAppPath() {
  let dir = join(process.cwd(), "apps", "client");
  const unixMatch = process.cwd().match(UNIX_SLASHES_REGEX);
  const winMatch = process.cwd().match(WIN_SLASHES_REGEX);

  if (unixMatch || winMatch) {
    dir = process.cwd();
  }

  return dir;
}

async function loadNextConfigI18n() {
  const path = pathToFileURL(join(getClientAppPath(), "i18n.config.mjs"));
  const nextConfig = (await import(path)).i18n;

  return nextConfig;
}

async function doesLocaleExist(locale) {
  const path = pathToFileURL(join(getClientAppPath(), "locales", locale, "common.json"));

  try {
    await readFile(path);
    return true;
  } catch {
    return false;
  }
}

const nextConfig = await loadNextConfigI18n();
const allLocales = nextConfig.locales;
const failedLocales = [];

for (const locale of allLocales) {
  const result = await doesLocaleExist(locale);

  if (!result) {
    failedLocales.push(locale);
  }
}

if (failedLocales.length > 0) {
  console.error(`
The following locales are missing: ${failedLocales.map((l) => `'${l}'`).join(", ")}
`);
  process.exitCode = 1;
} else {
  console.log("All locales have been validated");
}
