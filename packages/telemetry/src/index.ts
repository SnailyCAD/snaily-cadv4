import process from "node:process";
import os from "node:os";
import { execSync } from "node:child_process";
import { get, set } from "./cache";
import { getCADVersion } from "@snailycad/utils/version";

const TELEMETRY_ENABLED = process.env.TELEMETRY_ENABLED === "true";
const REPORT_URL = "";

interface ErrorReport {
  name: string;
  message: string;
  stack?: string;
}

export async function report(errorReport: ErrorReport) {
  if (!TELEMETRY_ENABLED) return;

  const [yarn, node, npm, cadVersion] = await Promise.all([
    getBinaryVersions("yarn"),
    getBinaryVersions("node"),
    getBinaryVersions("npm"),
    getCADVersion(),
  ]);

  const data = {
    yarn,
    npm,
    node,
    cadVersion,
    platform: os.platform(),
    os: os.platform(),
    ...errorReport,
  };

  const res = await fetch(REPORT_URL, {
    method: "POST",
    body: JSON.stringify(data),
    cache: "no-cache",
  });

  console.log({ res });
}

async function getBinaryVersions(command: "yarn" | "node" | "npm") {
  const cache = get(command);

  if (cache) {
    return cache;
  }

  try {
    const out = execSync(`${command} -v`, { encoding: "utf-8" }).toString().trim();
    set(command, out);
    return out;
  } catch {
    return null;
  }
}
