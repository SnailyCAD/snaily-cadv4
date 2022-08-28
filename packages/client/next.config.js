const { withSentryConfig } = require("@sentry/nextjs");

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
  experimental: {
    images: {
      allowFutureImage: true,
    },
  },
  images: {
    domains: ["localhost"],
  },
};

/** @type {typeof nextConfig} */
module.exports = withSentryConfig(nextConfig, {
  org: "snailycad",
  setCommits: true,
  project: "snailycad-client",
  authToken: "bce2b8a2e79f4336a3b115f171e675ab639d2d1f809a40919ca4493257a9c0e0",
  release: "default",
});
