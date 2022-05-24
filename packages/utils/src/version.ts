import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { spawnSync } from "node:child_process";

let currentVersionCached: string;
let currentCommitHash: string;

export async function getCADVersion() {
  const packageJsonPath = resolve(process.cwd(), "package.json");
  const packageJson = await readFile(packageJsonPath, "utf-8").catch(() => null);
  if (!packageJson) return null;

  const json = JSON.parse(packageJson);
  const localCommitHash = getCurrentGitHash();

  currentVersionCached ??= json.version;
  currentCommitHash = localCommitHash;

  return { currentVersion: currentVersionCached, currentCommitHash };
}

function getCurrentGitHash() {
  const command = "git";

  const outputBuffer = spawnSync(command, ["rev-parse", "--short=7", "HEAD"]);
  const output = outputBuffer.stdout.toString().replace("\n", "");

  return output;
}
