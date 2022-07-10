import { $log } from "@tsed/logger";
import { PlatformExpress } from "@tsed/platform-express";
import { Server } from "./server";
import { getCADVersion } from "@snailycad/utils/version";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";
import { prisma } from "lib/prisma";

Sentry.init({
  dsn: "https://308dd96b826c4e38a814fc9bae681687@o518232.ingest.sentry.io/6553288",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Prisma({ client: prisma }),
  ],
  tracesSampleRate: 1.0,
});

async function bootstrap() {
  try {
    const platform = await PlatformExpress.bootstrap(Server);

    await platform.listen();
    const versions = await getCADVersion();
    const versionStr = versions
      ? `with version ${versions.currentVersion} - ${versions.currentCommitHash}`
      : "";

    console.log(`SnailyCADv4 is running ${versionStr}`);
  } catch (er) {
    $log.error(er);
  }
}

void bootstrap();
