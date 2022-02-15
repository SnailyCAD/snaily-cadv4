import "dotenv/config";
import process from "node:process";
import { one } from "copy";
import { join } from "node:path";
import { readFileSync, writeFileSync } from "node:fs";

function addPortToClientPackageJson() {
  if (process.env.NODE_ENV === "development") return;
  let dir = join(process.cwd(), "package.json");
  const isWin = process.platform === "win32";
  
  if (!isWin && !dir.includes("/packages/client")) {
    dir = join(process.cwd(), "packages/client", "package.json");
  }

  let json = readFileSync(dir, "utf8");
  const port = process.env.PORT_CLIENT;

  if (port) {
    json = JSON.parse(json);
    json.scripts.start = `next start -p ${port}`;
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

let ENV_FILE_PATH = join(process.cwd(), ".env");

if (
  ENV_FILE_PATH.endsWith("/packages/client/.env") ||
  ENV_FILE_PATH.endsWith("/packages/api/.env")
) {
  ENV_FILE_PATH = ENV_FILE_PATH.replace(/packages\/(client|api)\//, "");
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
      const type = isClient ? "client" : isApi ? "api" : "Unknown";

      if (isClient) {
        addPortToClientPackageJson();
      }

      console.log(`✅ copied .env — ${type}`);
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

function hasArg(arg) {
  return args.includes(arg);
}
