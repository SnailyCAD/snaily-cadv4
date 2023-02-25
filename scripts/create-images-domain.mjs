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

  const data = await import(configFilePath);
  const text = await readFile(configFilePath, "utf8");

  return { data, text };
}

function writeNextConfig(data) {
  if (process.env.NODE_ENV === "development") return;

  const configFilePath = getNextConfigPath();
  return writeFile(
    configFilePath,
    format(data, {
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

function urlToDomain(fullUrl) {
  try {
    const url = new URL(fullUrl);

    if (url.hostname === "api") {
      return "localhost";
    }

    return `${url.hostname}`;
  } catch {
    return "localhost";
  }
}

const domain = urlToDomain(process.env.NEXT_PUBLIC_PROD_ORIGIN);
const { text } = await loadNextConfig();

const stringArray = text.split("\n");

const imagesIndex = stringArray.findIndex((line) => line.includes("images: { // start images"));
const imagesEndIndex = stringArray.findIndex((line) => line.includes("}, // end images"));

let imagesData = stringArray.slice(imagesIndex, imagesEndIndex).join("\n");
imagesData = imagesData.replace(/, "localhost"/, `, "localhost", "${domain}"`);

stringArray.splice(imagesIndex, imagesEndIndex - imagesIndex, imagesData);

const config = stringArray.join("\n");

writeNextConfig(config);

console.log("Image domain added to next.config.mjs");
