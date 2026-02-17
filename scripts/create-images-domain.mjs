import "dotenv/config";
import process from "node:process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";

const UNIX_SLASHES_REGEX = /\/apps\/client/;
const WIN_SLASHES_REGEX = /\\apps\\client/;

function getNextConfigPath() {
  let dir = join(process.cwd(), "apps", "client");
  const unixMatch = process.cwd().match(UNIX_SLASHES_REGEX);
  const winMatch = process.cwd().match(WIN_SLASHES_REGEX);

  if (unixMatch || winMatch) {
    dir = process.cwd();
  }

  const configFilePath = join(dir, "next.config.mjs");
  return pathToFileURL(configFilePath);
}

async function loadNextConfig() {
  const configFilePath = getNextConfigPath();
  const text = await readFile(configFilePath, "utf8");
  return { text };
}

async function writeNextConfig(data) {
  if (process.env.NODE_ENV === "development") return;

  const configFilePath = getNextConfigPath();
  return writeFile(
    configFilePath,
    await format(data, {
      endOfLine: "auto",
      semi: true,
      trailingComma: "all",
      singleQuote: false,
      printWidth: 100,
      tabWidth: 2,
      parser: "typescript",
    }),
  );
}

function getHostnameAndProtocol(fullUrl) {
  try {
    const url = new URL(fullUrl);
    if (url.hostname === "api") {
      return { hostname: "localhost", protocol: "http" };
    }
    const protocol = url.protocol === "https:" ? "https" : "http";
    return { hostname: url.hostname, protocol };
  } catch {
    return { hostname: "localhost", protocol: "http" };
  }
}

const { hostname, protocol } = getHostnameAndProtocol(process.env.NEXT_PUBLIC_PROD_ORIGIN);
const { text } = await loadNextConfig();

const lines = text.split("\n");
const imagesStart = lines.findIndex((line) => line.includes("images: { // start images"));
const imagesEnd = lines.findIndex((line) => line.includes("}, // end images"));

if (imagesStart === -1 || imagesEnd === -1) {
  console.warn("Could not find images block in next.config.mjs");
  process.exit(0);
}

const imagesBlock = lines.slice(imagesStart, imagesEnd + 1).join("\n");
const hostnameAlreadyPresent = imagesBlock.includes(`hostname: "${hostname}"`);

if (hostnameAlreadyPresent) {
  console.log("Image remotePatterns already include hostname:", hostname);
  process.exit(0);
}

// Find the line that closes remotePatterns (whitespace + ])
let insertAtIndex = -1;
for (let i = imagesStart; i <= imagesEnd; i++) {
  const trimmed = lines[i].trim();
  if (trimmed === "]") {
    insertAtIndex = i;
    break;
  }
}

if (insertAtIndex === -1) {
  console.warn("Could not find remotePatterns closing bracket");
  process.exit(0);
}

const newEntry = [
  "      {",
  `        protocol: "${protocol}",`,
  `        hostname: "${hostname}",`,
  // eslint-disable-next-line quotes
  `        pathname: "**"`,
  "      },",
];
lines.splice(insertAtIndex, 0, ...newEntry);

await writeNextConfig(lines.join("\n"));
console.log("Image remotePatterns updated in next.config.mjs");
