import { join } from "node:path";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import readline from "node:readline";
import { bold, green, underline } from "colorette";
import prettier from "prettier";
const { format } = prettier;

const PACKAGES_PATH = join(process.cwd(), "packages");

const packages = readdirSync(PACKAGES_PATH);
const utilPackages = packages.filter((v) => !["client", "api"].includes(v));

const version = await askNewVersion();

for (const pkg of packages) {
  const packageJsonPath = join(PACKAGES_PATH, pkg, "package.json");

  const packageJsonContentJSON = getJson(packageJsonPath);
  packageJsonContentJSON.version = version;

  if (["api", "client", "schemas"].includes(pkg)) {
    for (const utilPkg of utilPackages) {
      packageJsonContentJSON.dependencies[`@snailycad/${utilPkg}`] = version;
    }
  }

  writeFileSync(packageJsonPath, stringifyAndFormat(packageJsonContentJSON));
  console.log(`${green("INFO:")} Set version ${underline(version)} for ${underline(pkg)}\n`);
}

updateMainPackage();

async function askNewVersion() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question(bold("- Enter new version: "), (answer) => {
      if (!answer) reject();

      resolve(answer);
    });
  });
}

function getJson(path) {
  const packageJsonContentRaw = readFileSync(path, "utf-8");
  const packageJsonContentJSON = JSON.parse(packageJsonContentRaw);

  return packageJsonContentJSON;
}

function stringifyAndFormat(json) {
  return format(JSON.stringify(json, null, 2), { parser: "json" });
}

function updateMainPackage() {
  const packageJsonPath = join(process.cwd(), "package.json");

  const packageJsonContentJSON = getJson(packageJsonPath);
  packageJsonContentJSON.version = version;

  writeFileSync(packageJsonPath, stringifyAndFormat(packageJsonContentJSON));
  console.log(
    `${green("INFO:")} Set version ${underline(version)} for ${underline("snailycad")}\n`,
  );
}

process.exit();
