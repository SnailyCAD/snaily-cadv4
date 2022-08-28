import "dotenv/config";
import process from "node:process";
import { join } from "node:path";
import { readFile, writeFile } from "node:fs/promises";
import { format } from "prettier";

if (process.env.NODE_ENV === "development") return;

const UNIX_SLASHES_REGEX = /\/packages\/client/;
const WIN_SLASHES_REGEX = /\\packages\\client/;

function getNextConfigPath() {
  let dir = join(process.cwd(), "packages", "client");
  const unixMatch = process.cwd().match(UNIX_SLASHES_REGEX);
  const winMatch = process.cwd().match(WIN_SLASHES_REGEX);

  if (unixMatch || winMatch) {
    dir = process.cwd();
  }

  const configFilePath = join(dir, "next.config.js");
  return configFilePath;
}

async function loadNextConfig() {
  const configFilePath = getNextConfigPath();

  const data = (await import(configFilePath)).default;
  const text = await readFile(configFilePath, "utf8");

  return { data, text };
}

function writeNextConfig(data) {
  const configFilePath = getNextConfigPath();

  return writeFile(configFilePath, format(data, { parser: "babel" }));
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
const { data: nextConfig, text } = await loadNextConfig();

nextConfig.images.domains = ["localhost", domain];

const stringArray = text.split("\n");
const startIndex = stringArray.findIndex((line) => line.includes("const nextConfig = {"));
const endIndex = stringArray.findIndex((line) => line === "};");

stringArray.splice(startIndex + 1, endIndex - startIndex, JSON.stringify(nextConfig, null, 4));

const config = stringArray.join("\n").replace(/const nextConfig = {/, "const nextConfig =");

writeNextConfig(config);
