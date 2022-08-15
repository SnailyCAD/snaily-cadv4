/**
 * @template {import("next").NextConfig} T
 * @typedef {T}
 */
const nextConfig = {
  i18n: {
    locales: ["en", "en-gb", "ru", "cn", "tc", "fr-FR", "de-DE"],
    defaultLocale: "en",
  },
  cleanDistDir: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
