export async function getNextI18nConfig() {
  const nextConfig = (await import("../../../next.config.mjs")).i18n;
  return nextConfig;
}
