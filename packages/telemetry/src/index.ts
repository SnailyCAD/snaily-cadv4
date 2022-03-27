import process from "node:process";
import os from "node:os";
import { execSync } from "node:child_process";
import { get, set } from "./cache";

const TELEMETRY_ENABLED = process.env.TELEMETRY_ENABLED === "true";

interface ErrorReport {
  name: string;
  message: string;
  stack?: string;
}

export async function report(errorReport: ErrorReport) {
  if (!TELEMETRY_ENABLED) return;

  const [yarn, node, npm] = await Promise.all([
    getBinaryVersions("yarn"),
    getBinaryVersions("node"),
    getBinaryVersions("npm"),
  ]);

  const data = {
    yarn,
    npm,
    node,
    platform: os.platform(),
    os: os.platform(),
    ...errorReport,
  };

  data;
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
