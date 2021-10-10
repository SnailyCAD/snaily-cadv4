import { $log } from "@tsed/common";
import { PlatformExpress } from "@tsed/platform-express";
import { Server } from "./server";

async function bootstrap() {
  try {
    $log.debug("Starting server...");
    const platform = await PlatformExpress.bootstrap(Server);

    await platform.listen();
    console.info("SnailyCADv4 is running");
  } catch (er) {
    $log.error(er);
  }
}

bootstrap();
