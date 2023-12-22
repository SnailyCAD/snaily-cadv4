import "reflect-metadata";

import { Server } from "./server";
import { $log } from "@tsed/logger";
import { PlatformExpress } from "@tsed/platform-express";
import { importProviders } from "@tsed/components-scan";

import { getCADVersion } from "@snailycad/utils/version";
import * as Sentry from "@sentry/node";

import { prisma } from "lib/data/prisma";
import { registerDiscordRolesMetadata } from "lib/discord/register-metadata";
import { canSecureCookiesBeEnabled } from "utils/validate-environment-variables";
import { areRequiredCommandsInstalled } from "./utils/validate-requirements";

Sentry.init({
  dsn: "https://308dd96b826c4e38a814fc9bae681687@o518232.ingest.sentry.io/6553288",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: prisma }),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  attachStacktrace: true,
  ignoreErrors: [/can't reach database server at/gim],
  denyUrls: [/localhost/],
  enabled: process.env.NODE_ENV !== "development",
});

const rootDir = __dirname;

async function bootstrap() {
  try {
    await areRequiredCommandsInstalled();
    registerDiscordRolesMetadata();

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

    if (canSecureCookiesBeEnabled() === false) {
      $log.error(
        "Secure cookies (SECURE_COOKIES_FOR_IFRAME) could not be enabled because this SnailyCAD instance is not using HTTPS. https://docs.snailycad.org/docs/errors/secure-cookies-for-iframe",
      );
    }
  } catch (er) {
    $log.error(er);
  }
}

void bootstrap();

process
  .on("unhandledRejection", (error) => {
    console.error(error);
    console.error(`uncaughtException captured: ${error}`);
    Sentry.captureException(error);
  })
  .on("uncaughtException", (error) => {
    console.error(error);
    console.error(`uncaughtException captured: ${error}`);
    Sentry.captureException(error);
  });
