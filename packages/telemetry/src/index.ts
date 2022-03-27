import process from "node:process";
import axios from "axios";
import os from "node:os";
import { execSync } from "node:child_process";
import { get, set } from "./cache";
import { getCADVersion } from "@snailycad/utils/version";

const TELEMETRY_ENABLED = process.env.TELEMETRY_ENABLED === "true";
const REPORT_URL = "https://snailycad-telementry.caspertheghost.workers.dev/";

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
    stack: errorReport.stack ?? null,
    message: errorReport.message || null,
    name: errorReport.name || "Unknown Error",
  };

  try {
    await axios({
      url: REPORT_URL,
      method: "POST",
      data: JSON.stringify(data),
    });
  } catch (e: any) {
    if (process.env.NODE_ENV === "development") {
      console.log(e.response);
      console.log(e.response.data.errors);
    }
  }
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
