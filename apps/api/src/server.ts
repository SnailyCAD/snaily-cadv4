import "dotenv/config";
import "@tsed/swagger";
import "@tsed/socketio";
import "@tsed/platform-express";
import { join } from "node:path";
import process from "node:process";
import {
  Configuration,
  Inject,
  PlatformApplication,
  type PlatformContext,
  type Request,
  type Response,
  type ResponseErrorObject,
} from "@tsed/common";
import { Catch, type ExceptionFilterMethods } from "@tsed/platform-exceptions";
import type { Exception } from "@tsed/exceptions";
import { json } from "express";
import compress from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import { checkForUpdates } from "utils/check-for-updates";
import { getCADVersion } from "@snailycad/utils/version";
import * as Sentry from "@sentry/node";
import { parseCORSOrigin } from "utils/validate-environment-variables";
import { prisma } from "./lib/data/prisma";
import { request } from "undici";
import { z } from "zod";

const rootDir = __dirname;
const processEnvPort = process.env.PORT || process.env.PORT_API;
const allowedCorsOrigins = parseCORSOrigin(process.env.CORS_ORIGIN_URL ?? "http://localhost:3000");

if (process.env.NODE_ENV === "development") {
  allowedCorsOrigins.push("http://localhost:6006");
}

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
    cors({
      origin: allowedCorsOrigins,
      credentials: true,
    }),
    Sentry.Handlers.requestHandler({
      request: true,
      serverName: true,
    }),
    Sentry.Handlers.tracingHandler(),
  ],
  swagger: [
    {
      path: "/api-docs",
      specVersion: "3.0.3",
      spec: {
        info: {
          title: "SnailyCAD API Documentation",
          version: "0.0.0",
          contact: {
            name: "SnailyCAD Community Discord",
            url: "https://discord.gg/eGnrPqEH7U",
          },
        },
      },
    },
  ],
  socketIO: {
    maxHttpBufferSize: 1e8, // 100 mb
    pingTimeout: 60000,
    cors: {
      credentials: true,
      origin: allowedCorsOrigins,
    },
  },
})
export class Server {
  @Inject()
  app!: PlatformApplication;

  @Configuration()
  settings!: Configuration;

  private versions!: Awaited<ReturnType<typeof getCADVersion>>;

  public $beforeRoutesInit() {
    this.app.get("/", this.versionHandler());
    this.app.get("/v1", this.versionHandler());
  }

  public async $afterInit() {
    await checkForUpdates();
    await this.handleUseUpload();
  }

  // upload API & client URL for analytic purposes
  // only uploads the absolute minimum data
  protected async handleUseUpload() {
    if (process.env.NODE_ENV === "development") return;

    const URL = "https://uses.snailycad.org/register";
    const id = `${process.env.NEXT_PUBLIC_PROD_ORIGIN}_${process.env.NEXT_PUBLIC_CLIENT_URL}`;

    const versionObj = {
      currentVersion: this.versions?.currentVersion,
      commitHash: this.versions?.currentCommitHash,
    };

    const cad = await prisma.cad.findFirst({ select: { name: true } }).catch(() => null);

    const body = {
      id,
      name: cad?.name || null,
      version: JSON.stringify(versionObj),
      NEXT_PUBLIC_PROD_ORIGIN: process.env.NEXT_PUBLIC_PROD_ORIGIN,
      NEXT_PUBLIC_CLIENT_URL: process.env.NEXT_PUBLIC_CLIENT_URL,
    };

    const s = z.object({
      id: z.string(),
      name: z.string().nullable(),
      NEXT_PUBLIC_PROD_ORIGIN: z.string().url(),
      NEXT_PUBLIC_CLIENT_URL: z.string().url(),
      version: z.string().optional(),
    });

    const data = await s.safeParseAsync(body);

    if (!data.success) return;

    await request(URL, {
      method: "POST",
      body: JSON.stringify(data.data),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  protected versionHandler() {
    return async (_: Request, res: Response) => {
      const versions = await getCADVersion();
      this.versions = versions;

      res.setHeader("content-type", "text/html");
      return res
        .status(200)
        .send(
          `<html><head><title>SnailyCAD API</title></head><body>200 Success. Current CAD Version: ${versions?.currentVersion} - ${versions?.currentCommitHash}</body></html>`,
        );
    };
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
