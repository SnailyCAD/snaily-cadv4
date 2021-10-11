import { Configuration, Inject, PlatformApplication } from "@tsed/common";
import { json } from "express";
import compress from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";

const rootDir = __dirname;

@Configuration({
  rootDir,
  logger: {
    debug: true,
    level: process.env.NODE_ENV === "production" ? "off" : undefined,
  },
  mount: {
    "/v1": [`${rootDir}/controllers/**/*.ts`],
    "/v1/admin/manage": [`${rootDir}/controllers/admin/manage/*.ts`],
  },
  statics: {
    "/": [
      {
        root: `${process.cwd()}/public`,
      },
    ],
  },
})
export class Server {
  @Inject()
  app!: PlatformApplication;

  @Configuration()
  settings!: Configuration;

  public $beforeRoutesInit(): void | Promise<any> {
    this.app
      .use(cookieParser())
      .use(compress())
      .use(json())
      .use(
        cors({ origin: process.env.CORS_ORIGIN_URL ?? "http://localhost:3000", credentials: true }),
      );
  }
}
