import { init } from "@sentry/nextjs";

init({
  dsn: "https://6e31d0dc886d482091e293edb73eb10e@o518232.ingest.sentry.io/6553264",
  tracesSampleRate: 1.0,
  attachStacktrace: true,
  denyUrls: [/localhost/],
  ignoreErrors: [
    /loading chunk [\w+]+ failed/i,
    /hydration failed because the initial UI does not match what was rendered on the server/i,
    /There was an error while hydrating/i,
    /text content does not match server-rendered html/,
    "Text content does not match server-rendered HTML.",
    "There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.",
    "Hydration failed because the initial UI does not match what was rendered on the server.",
  ],
});
