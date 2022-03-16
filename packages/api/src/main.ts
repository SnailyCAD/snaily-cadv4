import { $log } from "@tsed/logger";
import { PlatformExpress } from "@tsed/platform-express";
import { Server } from "./server";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import process from "node:process";

async function bootstrap() {
  try {
    const platform = await PlatformExpress.bootstrap(Server);

    await platform.listen();
    const version = await getCADVersion();
    const versionStr = version ? `with version ${version}` : "";

    console.log(`SnailyCADv4 is running ${versionStr}`);
  } catch (er) {
    $log.error(er);
  }
}

let versionCache: string;
export async function getCADVersion(): Promise<string | null> {
  const packageJsonPath = resolve(process.cwd(), "package.json");
  const packageJson = await readFile(packageJsonPath, "utf-8").catch(() => null);
  if (!packageJson) return null;

  const json = JSON.parse(packageJson);

  versionCache ??= json.version;

  return versionCache;
}

bootstrap();
