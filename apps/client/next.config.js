/* eslint-disable @typescript-eslint/no-unnecessary-condition */
const { withSentryConfig } = require("@sentry/nextjs");
// const analyze = require("@next/bundle-analyzer");

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
  // prettier-ignore
  images: { // start images
    domains: ["i.imgur.com", "cdn.discordapp.com", "localhost", "localhost", "localhost"]
  }, // end images
  // prettier-enable
  webpack(config, { webpack }) {
    config.plugins.push(
      new webpack.DefinePlugin({
        __SENTRY_DEBUG__: false,
      }),
    );
    return config;
  },
  sentry: {
    hideSourceMaps: false,
  },
}; // end config

const withSentryNextConfig = withSentryConfig?.(nextConfig, {
  org: "snailycad",
  setCommits: true,
  project: "snailycad-client",
  authToken: "bce2b8a2e79f4336a3b115f171e675ab639d2d1f809a40919ca4493257a9c0e0",
  release: "default",
  silent: true,
  hideSourceMaps: false,
});

/** @type {typeof nextConfig} */
const config = withSentryNextConfig ?? nextConfig;

/** @type {typeof nextConfig} */
// module.exports = analyze({ enabled: process.env.ANALYZE === "true" })(nextConfig);
module.exports = config;
