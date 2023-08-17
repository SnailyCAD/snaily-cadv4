import "dotenv/config";
import process from "node:process";
import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { EOL } from "node:os";

const DEFAULT_PORT = "3000";

const UNIX_SLASHES_REGEX = /\/apps\/client/;
const WIN_SLASHES_REGEX = /\\apps\\client/;

async function addPortToClientPackageJson() {
  if (process.env.NODE_ENV === "development") return;

  try {
    const port = process.env.PORT_CLIENT;
    if (!port) return;

    let dir = join(process.cwd(), "apps", "client");
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

if (copyToClient) {
  addPortToClientPackageJson();
}

function hasArg(arg) {
  return args.includes(arg);
}
