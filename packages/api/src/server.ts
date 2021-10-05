import { Configuration, Inject, PlatformApplication } from "@tsed/common";
import { json } from "express";
import compress from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";

const rootDir = __dirname;

@Configuration({
  rootDir,
  mount: {
    "/v1": [`${rootDir}/controllers/**/*.ts`, `!${rootDir}/controllers/cad/**/*.ts`],
    "/v1/cad": [`${rootDir}/controllers/cad/**/*.ts`],
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
      .use(cors({ origin: "*", credentials: true }));
  }
}
