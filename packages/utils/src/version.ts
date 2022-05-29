import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { spawnSync } from "node:child_process";

let currentVersionCached: string;
let currentCommitHash: string;

export async function getCADVersion() {
  const localCommitHash = getCurrentGitHash();
  const localPackageVersion = await getLocalPackageVersion();
  if (!localPackageVersion) return null;

  currentVersionCached ??= localPackageVersion;
  currentCommitHash = localCommitHash;

  return { currentVersion: currentVersionCached, currentCommitHash };
}

async function getLocalPackageVersion(): Promise<string | null> {
  const packageJsonPath = resolve(process.cwd(), "package.json");
  const packageJson = await readFile(packageJsonPath, "utf-8").catch(() => null);
  if (!packageJson) return null;

  const json = JSON.parse(packageJson);
  return json.version;
}

function getCurrentGitHash() {
  const command = "git";

  const outputBuffer = spawnSync(command, ["rev-parse", "--short=7", "HEAD"]);
  const output = outputBuffer.stdout.toString().replace("\n", "");

  return output;
}
