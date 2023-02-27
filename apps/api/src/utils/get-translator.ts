import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createTranslator } from "use-intl";

interface TranslateOptions {
  locale?: string | null;
  namespace?: string;
  type: "webhooks" | "error-messages" | "common";
}

let defaultLocale: string | undefined;

export async function getTranslator(options: TranslateOptions) {
  if (!defaultLocale) {
    defaultLocale = await loadDefaultLocale();
  }

  const locale = options.locale ?? "en";
  const translations = await loadTranslationFile(locale, options.type);

  const translator = createTranslator({
    locale,
    onError: console.info,
    messages: translations,
    namespace: options.namespace,
  });

  return translator;
}

async function loadTranslationFile(locale: string, type: "webhooks" | "error-messages" | "common") {
  try {
    const translationFile = await import(`../../../client/locales/${locale}/${type}.json`);
    return translationFile;
  } catch {
    return import(`../../../client/locales/en/${type}.json`);
  }
}

// the i18n config is a mjs file, so we need to parse it to get the default locale
async function loadDefaultLocale() {
  try {
    const path = resolve(__dirname, "../../../client/i18n.config.mjs");
    const rawJSON = (await readFile(path, "utf-8"))
      .replace("export const i18n = ", "")
      .replace(";", "");

    const defaultLocaleMatcher = /defaultLocale: "(?<defaultLocale>[a-z]{2})"/;
    const defaultLocaleMatch = defaultLocaleMatcher.exec(rawJSON);
    const defaultLocale = defaultLocaleMatch?.groups?.defaultLocale;

    return defaultLocale ?? "en";
  } catch (err) {
    return "en";
  }
}
