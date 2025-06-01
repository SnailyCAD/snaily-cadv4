export async function getNextI18nConfig() {
  const nextConfig = (await import("../../../i18n.config.mjs")).i18n;
  return nextConfig;
}
