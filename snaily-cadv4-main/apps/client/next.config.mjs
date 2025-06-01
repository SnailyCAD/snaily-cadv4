import { withSentryConfig } from "@sentry/nextjs";
import { i18n } from "./i18n.config.mjs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const json = require("./package.json");

/**
 * @template {import("next").NextConfig} T
 * @typedef {T}
 */
const nextConfig = {
  i18n,
  cleanDistDir: true,
  experimental: {
    webpackBuildWorker: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // prettier-ignore
  images: { // start images
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.imgur.com",
        pathname: "**"
      },
      {
        protocol: "https",
        hostname: "cdn.discordapp.com",
        pathname: "**"
      },
      {
        protocol: "http",
        hostname: "localhost",
        pathname: "**"
      },
    ]
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
    widenClientFileUpload: true,
  },
}; // end config

/** @type {typeof nextConfig} */
export default (phase, defaultConfig) => {
  const plugins = [
    (config) =>
      withSentryConfig(
        config,
        {
          org: "snailycad",
          setCommits: true,
          project: "snailycad-client",
          authToken: "bce2b8a2e79f4336a3b115f171e675ab639d2d1f809a40919ca4493257a9c0e0",
          release: json.version,
          silent: true,
          hideSourceMaps: false,
          widenClientFileUpload: true,
        },
        {
          tunnelRoute: "/api/monitoring-tunnel",
        },
      ),
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
