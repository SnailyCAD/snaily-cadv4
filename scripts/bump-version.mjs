import { join } from "node:path";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import readline from "node:readline";
import { bold, green, underline } from "colorette";
import prettier from "prettier";
const { format } = prettier;

const PACKAGES_PATH = join(process.cwd(), "packages");
const APPS_PATH = join(process.cwd(), "apps");

const packages = readdirSync(PACKAGES_PATH).filter((v) => !v.endsWith(".md"));
const apps = readdirSync(APPS_PATH).filter((v) => !v.endsWith(".md"));
const allPackages = [...packages, ...apps];

const version = await askNewVersion();

for (const pkg of allPackages) {
  const isApp = apps.includes(pkg);
  const packageJsonPath = join(isApp ? APPS_PATH : PACKAGES_PATH, pkg, "package.json");

  const packageJsonContentJSON = getJson(packageJsonPath);

  if (!packageJsonContentJSON) continue;
  packageJsonContentJSON.version = version;

  for (const utilPkg of packages) {
    const isInDep = packageJsonContentJSON.dependencies?.[`@snailycad/${utilPkg}`];
    const isInDevDep = packageJsonContentJSON.devDependencies?.[`@snailycad/${utilPkg}`];

    if (isInDep) {
      packageJsonContentJSON.dependencies[`@snailycad/${utilPkg}`] = version;
    } else if (isInDevDep) {
      packageJsonContentJSON.devDependencies[`@snailycad/${utilPkg}`] = version;
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
  try {
    const packageJsonContentRaw = readFileSync(path, "utf-8");
    const packageJsonContentJSON = JSON.parse(packageJsonContentRaw);

    return packageJsonContentJSON;
  } catch {
    return null;
  }
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
