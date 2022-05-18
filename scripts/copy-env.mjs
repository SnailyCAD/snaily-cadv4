import "dotenv/config";
import process from "node:process";
import { one } from "copy";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

const DEFAULT_PORT = "3000";

function addPortToClientPackageJson() {
  if (process.env.NODE_ENV === "development") return;
  let dir = join(process.cwd(), "packages", "client");
  const includesMultipleClients = dir.split("client").length >= 2;

  console.log({ includesMultipleClients });

  if (includesMultipleClients) {
    dir = dir.replaceAll("packages/client", "");
    dir = join(dir, "packages/client");
  }

  let json = readFileSync(join(dir, "package.json"), "utf8");
  const port = process.env.PORT_CLIENT;

  if (port && port !== DEFAULT_PORT) {
    json = JSON.parse(json);
    json.scripts.start = `yarn next start -p ${port}`;
    json = JSON.stringify(json, null, 2);

    writeFileSync(dir, json, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
}

const [, , ...args] = process.argv;
const copyToClient = hasArg("--client");
const copyToApi = hasArg("--api");
const copyToTelemetry = hasArg("--telemetry");

let ENV_FILE_PATH = join(process.cwd(), ".env");

if (
  ENV_FILE_PATH.endsWith("/packages/client/.env") ||
  ENV_FILE_PATH.endsWith("/packages/api/.env") ||
  ENV_FILE_PATH.endsWith("/packages/telemetry/.env")
) {
  ENV_FILE_PATH = ENV_FILE_PATH.replace(/packages\/(client|api|telemetry)\//, "");
}

/**
 * @param {string} distDir
 */
async function copyEnv(distDir) {
  try {
    one(ENV_FILE_PATH, distDir, (error) => {
      if (error) {
        console.log({ error });
        return;
      }

      const isClient = distDir.endsWith("client");
      const isApi = distDir.endsWith("api");
      const type = isClient ? "client" : isApi ? "api" : null;

      if (isClient) {
        addPortToClientPackageJson();
      }

      if (type) {
        console.log(`✅ copied .env — ${type}`);
      }
    });
  } catch (e) {
    console.log({ e });
  }
}

if (copyToClient) {
  const CLIENT_PACKAGE_PATH = join(process.cwd(), "packages", "client");
  copyEnv(CLIENT_PACKAGE_PATH);
}

if (copyToApi) {
  const API_PACKAGE_PATH = join(process.cwd(), "packages", "api");
  copyEnv(API_PACKAGE_PATH);
}

if (copyToTelemetry) {
  const TL_PACKAGE_PATH = join(process.cwd(), "packages", "telemetry");
  copyEnv(TL_PACKAGE_PATH);
}

function hasArg(arg) {
  return args.includes(arg);
}
