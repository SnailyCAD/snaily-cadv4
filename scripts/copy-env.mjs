import { one } from "copy";
import { join } from "node:path";
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";

readFileSync("./packages/client/package.json", "utf8", (err, json) => {

  const port = process.env.PORT_CLIENT;
  if (port) {
    json = JSON.parse(json);
    json.scripts.start = `next start -p ${port}`;
    json = JSON.stringify(json, null, 2);
    fs.writeFile("./packages/client/package.json", json, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
});

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

      const type =
        (distDir.endsWith("client") && "client") || (distDir.endsWith("api") && "api") || "Unknown";

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
