import { Replay, init } from "@sentry/nextjs";
import { BrowserTracing } from "@sentry/browser";

init({
  dsn: "https://6e31d0dc886d482091e293edb73eb10e@o518232.ingest.sentry.io/6553264",
  tracesSampleRate: 0.4,
  attachStacktrace: true,
  denyUrls: [/localhost/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 0.4,
  enabled: process.env.NODE_ENV !== "development",
  ignoreErrors: [
    /loading chunk/i,
    /hydration failed because the initial UI does not match what was rendered on the server/i,
    /There was an error while hydrating/gi,
    /text content does not match server-rendered html/,
    "Text content does not match server-rendered HTML.",
    "There was an error while hydrating. Because the error happened outside of a Suspense boundary, the entire root will switch to client rendering.",
    "Hydration failed because the initial UI does not match what was rendered on the server.",
    "Cannot have two HTML5 backends at the same time.",
    /Cannot resolve a DOM point from Slate point:/gi,
    /Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node./gi,
    "Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.",
    "The object can not be found here.",
    /AbortError/gi,
    /ResizeObserver/gi,
    "ResizeObserver loop completed with undelivered notifications.",
  ],
  integrations(integrations) {
    return [...integrations, new BrowserTracing(), new Replay()];
  },
});
