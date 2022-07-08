const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import("@sentry/nextjs").SentryWebpackPluginOptions} */
const sentryConfig = {
  silent: true,
  org: "SnailyCAD",
};

// const USE_SENTRY =
//   process.env.NODE_ENV === "development" && process.env.TELEMETRY_ENABLED === "true";

/** @type {import("next").NextConfig} */
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

function withConfig(nextConfig) {
  return withSentryConfig(nextConfig, sentryConfig);
}

module.exports = withConfig(nextConfig);
