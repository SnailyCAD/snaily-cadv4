import { join, resolve } from "node:path";
import { readFile, readdir } from "node:fs/promises";

const DEFAULT_LOCALE = "en";
const defaultLocaleTranslations = await getDefaultLocaleTranslations();

const [localeToCheck] = process.argv.slice(2);

console.info(`Checking missing translations for locale "${localeToCheck}"...`);

const locales = await readdir(getLocalesPath());

if (!locales.includes(localeToCheck)) {
  console.info(`Locale ${localeToCheck} not found`);
  console.info("Available locales:", locales.join(", "));
  process.exit(1);
}

await getInitialTranslations();

async function readLocaleFile(locale, file) {
  const localesPath = getLocalesPath();
  const filePath = resolve(localesPath, locale, file);

  const data = await readFile(filePath, "utf8");
  return JSON.parse(data);
}

async function getLocaleFilesFromLocale(locale) {
  const localesPath = getLocalesPath();
  return readdir(resolve(localesPath, locale), "utf8");
}

async function getInitialTranslations() {
  const localeFiles = await getLocaleFilesFromLocale(localeToCheck);
  let mergedLocaleTranslations = {};

  for (const file of localeFiles) {
    const translations = await readLocaleFile(localeToCheck, file);

    mergedLocaleTranslations = {
      ...mergedLocaleTranslations,
      ...translations,
    };
  }

  checkMissingKeys(localeToCheck, mergedLocaleTranslations);
}

function getLocalesPath() {
  const UNIX_SLASHES_REGEX = /\/apps\/client/;
  const WIN_SLASHES_REGEX = /\\apps\\client/;

  let dir = join(process.cwd(), "apps", "client", "locales");
  const unixMatch = process.cwd().match(UNIX_SLASHES_REGEX);
  const winMatch = process.cwd().match(WIN_SLASHES_REGEX);

  if (unixMatch || winMatch) {
    dir = process.cwd();
  }

  return resolve(dir);
}

async function getDefaultLocaleTranslations() {
  const localeFiles = await getLocaleFilesFromLocale(DEFAULT_LOCALE);
  let mergedLocaleTranslations = {};

  for (const file of localeFiles) {
    const translations = await readLocaleFile(DEFAULT_LOCALE, file);

    mergedLocaleTranslations = {
      ...mergedLocaleTranslations,
      ...translations,
    };
  }

  return mergedLocaleTranslations;
}

function checkMissingKeys(locale, translations = {}) {
  const missingKeys = [];

  for (const key in defaultLocaleTranslations) {
    if (typeof translations[key] === "undefined") {
      missingKeys.push(key);
      continue;
    }

    if (typeof translations[key] === "object") {
      for (const subKey in defaultLocaleTranslations[key]) {
        if (typeof translations[key][subKey] === "undefined") {
          missingKeys.push(`${key}.${subKey}`);
        }
      }
    }
  }
  console.info(`Missing keys for ${locale}:`, missingKeys);
}
