module.exports = {
  async redirects() {
    return [
      {
        source: "/",
        destination: "/citizen",
        permanent: true,
      },
    ];
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  cleanDistDir: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};
