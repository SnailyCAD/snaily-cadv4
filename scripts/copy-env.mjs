import { one } from "copy";
import { join } from "node:path";

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

async function copyEnv(distDir) {
  try {
    one(ENV_FILE_PATH, distDir, (error) => {
      if (error) {
        console.log({ error });
        return;
      }

      console.log("✅ copied .env");
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
