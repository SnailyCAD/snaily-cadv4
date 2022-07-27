/**
 * @template {import("next").NextConfig} T
 * @typedef {T}
 */
const nextConfig = {
  i18n: {
    locales: ["en", "en_gb", "ru", "cn", "tc", "fr_FRA"],
    defaultLocale: "en",
  },
  cleanDistDir: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
