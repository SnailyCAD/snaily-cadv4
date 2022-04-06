import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import process from "node:process";

let versionCache: string;
export async function getCADVersion(): Promise<string | null> {
  const packageJsonPath = resolve(process.cwd(), "package.json");
  const packageJson = await readFile(packageJsonPath, "utf-8").catch(() => null);
  if (!packageJson) return null;

  const json = JSON.parse(packageJson);

  versionCache ??= json.version;

  return versionCache;
}
