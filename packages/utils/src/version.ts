import { fetch } from "undici";
import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { spawnSync } from "node:child_process";

let currentVersionCached: string;
let currentCommitHash: string;
let latestReleaseVersion: string | null;

export async function getCADVersion() {
  const localCommitHash = getCurrentGitHash();
  const localPackageVersion = await getLocalPackageVersion();
  const releaseVersion = await getLatestReleaseVersion();
  if (!localPackageVersion || !localCommitHash) return null;

  currentVersionCached ??= localPackageVersion;
  currentCommitHash = localCommitHash;
  latestReleaseVersion = releaseVersion;

  return { currentVersion: currentVersionCached, latestReleaseVersion, currentCommitHash };
}

async function getLocalPackageVersion(): Promise<string | null> {
  try {
    const packageJsonPath = resolve(process.cwd(), "package.json");
    const packageJson = await readFile(packageJsonPath, "utf-8").catch(() => null);
    if (!packageJson) return null;

    const json = JSON.parse(packageJson);
    return json.version;
  } catch {
    return null;
  }
}

function getCurrentGitHash() {
  try {
    if (process.env.RAILWAY_GIT_COMMIT_SHA) {
      return process.env.RAILWAY_GIT_COMMIT_SHA as string;
    }

    const command = "git";

    const outputBuffer = spawnSync(command, ["rev-parse", "--short=7", "HEAD"]);
    const output = outputBuffer.stdout.toString().replace("\n", "");

    return output;
  } catch {
    return null;
  }
}

async function getLatestReleaseVersion() {
  try {
    const response = await fetch(
      "https://api.github.com/repos/SnailyCAD/snaily-cadv4/releases/latest",
      {
        headers: { Accept: "application/vnd.github+json" },
      },
    );

    const json = (await response.json()) as { tag_name: string; html_url: string };

    return json.tag_name;
  } catch {
    return null;
  }
}
