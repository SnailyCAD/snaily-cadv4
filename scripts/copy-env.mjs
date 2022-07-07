import "dotenv/config";
import process from "node:process";
import { one } from "copy";
import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { EOL } from "node:os";

const DEFAULT_PORT = "3000";

const UNIX_SLASHES_REGEX = /\/packages\/client/;
const WIN_SLASHES_REGEX = /\\packages\\client/;

async function addPortToClientPackageJson() {
  if (process.env.NODE_ENV === "development") return;

  try {
    const port = process.env.PORT_CLIENT;
    if (!port) return;

    let dir = join(process.cwd(), "packages", "client");
    const unixMatch = process.cwd().match(UNIX_SLASHES_REGEX);
    const winMatch = process.cwd().match(WIN_SLASHES_REGEX);

    if (unixMatch || winMatch) {
      dir = process.cwd();
    }

    const jsonFilePath = join(dir, "package.json");
    const json = JSON.parse(await readFile(jsonFilePath, "utf8"));

    if (!json.scripts.start.includes(`-p ${DEFAULT_PORT}`) && port === DEFAULT_PORT) {
      json.scripts.start = "yarn next start"; // reset the port back to default
    } else {
      json.scripts.start = `yarn next start -p ${port}`;
    }

    await writeFile(jsonFilePath, JSON.stringify(json, null, 2) + EOL);
  } catch (e) {
    console.log(e);
    console.log("Could not set the PORT_CLIENT. Continuing build...");
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
  addPortToClientPackageJson();
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
