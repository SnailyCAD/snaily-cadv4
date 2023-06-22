import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { $log } from "@tsed/logger";

import { getCADVersion } from "@snailycad/utils/version";
import * as Sentry from "@sentry/node";
import { ProfilingIntegration } from "@sentry/profiling-node";

import { prisma } from "lib/data/prisma";
import { registerDiscordRolesMetadata } from "lib/discord/register-metadata";
import { canSecureCookiesBeEnabled, parseCORSOrigin } from "utils/validate-environment-variables";
import { AppModule } from "./app";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import fastifyCookie from "@fastify/cookie";
import helmet from "@fastify/helmet";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "@fastify/compress";

Sentry.init({
  dsn: "https://308dd96b826c4e38a814fc9bae681687@o518232.ingest.sentry.io/6553288",
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: prisma }),
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  attachStacktrace: true,
  ignoreErrors: [/invocation: Can't reach database server at/gi],
  denyUrls: [/localhost/],
});

const parsedCORSOrigin = parseCORSOrigin(process.env.CORS_ORIGIN_URL ?? "http://localhost:3000");
const allowedCorsOrigins = [parsedCORSOrigin];

if (process.env.NODE_ENV === "development") {
  allowedCorsOrigins.push("http://localhost:6006");
}

async function bootstrap() {
  try {
    registerDiscordRolesMetadata();

    const app = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({
        logger: true,
      }),
      { rawBody: true },
    );

    const FIVE_HUNDRED_KB = 500_000;
    app.useBodyParser("json", { bodyLimit: FIVE_HUNDRED_KB });
    app.register(fastifyCookie, {});
    app.register(helmet, { contentSecurityPolicy: false });
    app.register(compression);
    app.enableCors({
      origin: allowedCorsOrigins,
      credentials: true,
    });

    const options = new DocumentBuilder()
      .setTitle("SnailyCAD API")
      .setVersion("3.0")
      .setContact(
        "SnailyCAD Community Discord",
        "https://discord.gg/eGnrPqEH7U",
        "hello@snailycad.org",
      )
      .build();
    const document = SwaggerModule.createDocument(app, options);

    SwaggerModule.setup("/api-docs", app, document);

    await app.listen(8080, "0.0.0.0");

    const versions = await getCADVersion();
    const versionStr = versions
      ? `with version ${versions.currentVersion} - ${versions.currentCommitHash}`
      : "";

    Sentry.setTags({
      "snailycad.version": versions?.currentVersion,
      "snailycad.commitHash": versions?.currentCommitHash,
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
