export async function getNextI18nConfig() {
  const nextConfig = (await import("../../../next.config")).default;
  return nextConfig.i18n;
}
