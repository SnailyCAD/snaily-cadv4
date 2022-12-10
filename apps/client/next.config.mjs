// const analyze = require("@next/bundle-analyzer");
import { withSentryConfig } from "@sentry/nextjs";

/**
 * @template {import("next").NextConfig} T
 * @typedef {T}
 */
const nextConfig = {
  i18n: {
    locales: ["en", "en-gb", "ru", "cn", "tc", "fr-FR", "de-DE", "pt-BR", "cs-CZ"],
    defaultLocale: "en",
  },
  cleanDistDir: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  // prettier-ignore
  images: { // start images
    formats: ["image/avif", "image/webp"],
    domains: ["i.imgur.com", "cdn.discordapp.com", "localhost"]
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

export const i18n = nextConfig.i18n;

/** @type {typeof nextConfig} */
export default (phase, defaultConfig) => {
  const plugins = [
    // presume I have other plugins
    (config) =>
      withSentryConfig(config, {
        org: "snailycad",
        setCommits: true,
        project: "snailycad-client",
        authToken: "bce2b8a2e79f4336a3b115f171e675ab639d2d1f809a40919ca4493257a9c0e0",
        release: "default",
        silent: true,
        hideSourceMaps: false,
      }),
  ];

  const config = plugins.reduce(
    (acc, plugin) => {
      const pluginReturnValue = plugin(acc);

      let newConfig;
      if (typeof pluginReturnValue === "function") {
        newConfig = pluginReturnValue(phase, defaultConfig);
      } else {
        newConfig = pluginReturnValue;
      }

      return newConfig;
    },
    { ...nextConfig },
  );

  return config;
};
