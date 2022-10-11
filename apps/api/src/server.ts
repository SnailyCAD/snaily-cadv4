import "@tsed/swagger";
import "@tsed/socketio";
import "@tsed/platform-express";
import { join } from "node:path";
import process from "node:process";
import {
  Configuration,
  Inject,
  PlatformApplication,
  PlatformContext,
  Request,
  Response,
  ResponseErrorObject,
} from "@tsed/common";
import { Catch, ExceptionFilterMethods } from "@tsed/platform-exceptions";
import type { Exception } from "@tsed/exceptions";
import { json } from "express";
import compress from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import { IsEnabled } from "middlewares/IsEnabled";
import { checkForUpdates } from "utils/checkForUpdates";
import { getCADVersion } from "@snailycad/utils/version";
import * as Sentry from "@sentry/node";

const rootDir = __dirname;
const processEnvPort = process.env.PORT || process.env.PORT_API;

@Configuration({
  rootDir,
  port: processEnvPort ? parseInt(processEnvPort) : 8080,
  logger: {
    debug: true,
    level: process.env.NODE_ENV === "production" ? "error" : "info",
  },
  mount: {
    "/v1": [`${rootDir}/controllers/**/*.ts`],
  },
  statics: {
    "/static": [
      {
        cacheControl: true,
        etag: true,
        immutable: true,
        maxAge: "365d",
        root: join(rootDir, "../", "public"),
        hook: "$beforeRoutesInit",
      },
    ],
  },
  middlewares: [
    cookieParser(),
    compress(),
    json({ limit: "500kb" }),
    cors({ origin: process.env.CORS_ORIGIN_URL ?? "http://localhost:3000", credentials: true }),
    IsEnabled,
    Sentry.Handlers.requestHandler({
      request: true,
    }),
  ],
  swagger: [{ path: "/api-docs", specVersion: "3.0.3" }],
  socketIO: {
    cors: {
      credentials: true,
      origin: process.env.CORS_ORIGIN_URL ?? "http://localhost:3000",
    },
  },
})
export class Server {
  @Inject()
  app!: PlatformApplication;

  @Configuration()
  settings!: Configuration;

  public $beforeRoutesInit() {
    this.app.get("/", async (_: Request, res: Response) => {
      const versions = await getCADVersion();

      res.setHeader("content-type", "text/html");
      return res
        .status(200)
        .send(
          `<html><head><title>SnailyCAD API</title></head><body>200 Success. Current CAD Version: ${versions?.currentVersion} - ${versions?.currentCommitHash}</body></html>`,
        );
    });
  }

  public async $afterInit() {
    await checkForUpdates();
  }
}

@Catch(Error)
export class ErrorFilter implements ExceptionFilterMethods {
  catch(exception: Exception, ctx: PlatformContext) {
    const { response, logger } = ctx;
    const error = this.mapError(exception);
    const headers = this.getHeaders(exception);

    Sentry.captureException(exception);

    logger.error({
      error,
      catch: true,
    });

    response
      .setHeaders(headers)
      .status(error.status || 500)
      .body(error);
  }

  mapError(error: Exception) {
    return {
      name: error.origin?.name || error.name,
      message: error.message,
      status: error.status || 500,
      errors: this.getErrors(error),
    };
  }

  private getErrors(error: Exception) {
    return [error, error.origin].filter(Boolean).reduce((errs, { errors }: ResponseErrorObject) => {
      return [...errs, ...(errors || [])];
    }, []);
  }

  private getHeaders(error: Exception) {
    return [error, error.origin].filter(Boolean).reduce((obj, { headers }: ResponseErrorObject) => {
      return {
        ...obj,
        ...(headers || {}),
      };
    }, {});
  }
}
