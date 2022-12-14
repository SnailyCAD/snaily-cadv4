import { init } from "@sentry/nextjs";
import "@sentry/tracing";

init({
  dsn: "https://6e31d0dc886d482091e293edb73eb10e@o518232.ingest.sentry.io/6553264",
  tracesSampleRate: 1.0,
  attachStacktrace: true,
});
