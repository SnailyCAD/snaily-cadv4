// import { i18n } from "../../../client/i18n.config.mjs";
import { createTranslator } from "use-intl";

interface TranslateOptions {
  locale?: string | null;
  namespace?: string;
}

export async function getTranslator(options: TranslateOptions) {
  const locale = options.locale ?? "en";
  const translations = await loadTranslationFile(locale);

  const translator = createTranslator({
    locale,
    onError: console.info,
    messages: translations,
    namespace: options.namespace,
  });

  console.log({ translations });
  return translator;
}

async function loadTranslationFile(locale: string) {
  try {
    const translationFile = await import(`../../../client/locales/${locale}/webhooks.json`);
    return translationFile;
  } catch {
    return import("../../../client/locales/en/webhooks.json");
  }
}
