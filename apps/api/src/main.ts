import "reflect-metadata";

import { Server } from "./server";
import { $log } from "@tsed/logger";
import { PlatformExpress } from "@tsed/platform-express";
import { importProviders } from "@tsed/components-scan";

import { getCADVersion } from "@snailycad/utils/version";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

import { prisma } from "lib/data/prisma";
import { registerDiscordRolesMetadata } from "lib/discord/register-metadata";

Sentry.init({
  dsn: "https://308dd96b826c4e38a814fc9bae681687@o518232.ingest.sentry.io/6553288",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Tracing.Integrations.Prisma({ client: prisma }),
  ],
  tracesSampleRate: 1.0,
  attachStacktrace: true,
});

const rootDir = __dirname;

try {
  registerDiscordRolesMetadata();
} catch {
  // empty
}

async function bootstrap() {
  try {
    const scannedProviders = await importProviders({
      mount: {
        "/v1": [`${rootDir}/controllers/**/*.ts`],
      },
    });

    const platform = await PlatformExpress.bootstrap(Server, {
      ...scannedProviders,
    });

    await platform.listen();
    const versions = await getCADVersion();
    const versionStr = versions
      ? `with version ${versions.currentVersion} - ${versions.currentCommitHash}`
      : "";

    Sentry.setTags({
      "snailycad.version": versions?.currentVersion,
      "snailycad.commitHash": versions?.currentCommitHash,
    });

    process.on("SIGINT", () => {
      platform.stop();
    });

    const nodeVersion = process.versions.node;

    console.log(`SnailyCADv4 is running ${versionStr}. Node version: ${nodeVersion}`);
  } catch (er) {
    $log.error(er);
  }
}

void bootstrap();

process
  .on("unhandledRejection", (error) => {
    console.error(`uncaughtException captured: ${error}`);
    Sentry.captureException(error);
  })
  .on("uncaughtException", (error) => {
    console.error(`uncaughtException captured: ${error}`);
    Sentry.captureException(error);
  });
