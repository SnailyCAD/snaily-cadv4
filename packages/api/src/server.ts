import { Configuration, Inject, PlatformApplication, Response } from "@tsed/common";
import { json } from "express";
import "@tsed/socketio";
import compress from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import { IsEnabled } from "middlewares/IsEnabled";
import { join } from "node:path";

const rootDir = __dirname;

@Configuration({
  rootDir,
  port: process.env.PORT_API ? parseInt(process.env.PORT_API) : 8080,
  logger: {
    debug: true,
    level: process.env.NODE_ENV === "production" ? "off" : "error",
  },
  mount: {
    "/v1": [`${rootDir}/controllers/**/*.ts`],
  },
  statics: {
    "/static": [
      {
        root: join(rootDir, "../", "public"),
        hook: "$beforeRoutesInit",
      },
    ],
  },
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

  public $beforeRoutesInit(): void | Promise<any> {
    this.app
      .use(cookieParser())
      .use(compress())
      .use(json())
      .use(
        cors({ origin: process.env.CORS_ORIGIN_URL ?? "http://localhost:3000", credentials: true }),
      )
      .use(IsEnabled);

    if (process.env.EXPERIMENTAL_SECURE_CONTEXT) {
      const app = this.app.callback();
      app.set("trust proxy", 1);
    }

    this.app.get("/", (_: any, res: Response) => {
      res.setHeader("content-type", "text/html");
      return res
        .status(200)
        .send("<html><head><title>SnailyCAD API</title></head><body>200 Success</body></html>");
    });
  }
}
