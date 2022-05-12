import { $log } from "@tsed/logger";
import { PlatformExpress } from "@tsed/platform-express";
import { Server } from "./server";
import { getCADVersion } from "@snailycad/utils/version";

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
