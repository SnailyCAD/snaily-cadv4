import { init } from "@sentry/nextjs";
import { BrowserTracing } from "@sentry/tracing";

init({
  dsn: "https://6e31d0dc886d482091e293edb73eb10e@o518232.ingest.sentry.io/6553264",
  tracesSampleRate: 1.0,
  attachStacktrace: true,
  integrations(integrations) {
    integrations = [...integrations, new BrowserTracing()];
    return integrations.filter((integration) => integration.name !== "Breadcrumbs");
  },
});
