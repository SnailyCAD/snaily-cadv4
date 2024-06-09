import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: "https://308dd96b826c4e38a814fc9bae681687@o518232.ingest.sentry.io/6553288",
  integrations: [
    Sentry.httpIntegration(),
    Sentry.prismaIntegration(),
    Sentry.nestIntegration(),
    Sentry.consoleIntegration(),
    Sentry.onUnhandledRejectionIntegration(),
    Sentry.onUncaughtExceptionIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  attachStacktrace: true,
  ignoreErrors: [/can't reach database server at/gim],
  denyUrls: [/localhost/],
  enabled: process.env.NODE_ENV !== "development",
});
