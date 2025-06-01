import { join } from "node:path";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { green, underline } from "colorette";
import { format } from "prettier";

const PACKAGES_PATH = join(process.cwd(), "packages");
const APPS_PATH = join(process.cwd(), "apps");
const [, , version] = process.argv;

if (!version) {
  throw new Error("Must specify a new version.");
}

const packages = readdirSync(PACKAGES_PATH).filter((v) => !v.endsWith(".md"));
const apps = readdirSync(APPS_PATH).filter((v) => !v.endsWith(".md"));
const allPackages = [...packages, ...apps];

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
      const isWorkspace = isInDep.startsWith("workspace:");
      packageJsonContentJSON.dependencies[`@snailycad/${utilPkg}`] = isWorkspace
        ? "workspace:*"
        : `^${version}`;
    } else if (isInDevDep) {
      const isWorkspace = isInDevDep.startsWith("workspace:");

      packageJsonContentJSON.devDependencies[`@snailycad/${utilPkg}`] = isWorkspace
        ? "workspace:*"
        : `^${version}`;
    }
  }

  writeFileSync(packageJsonPath, await stringifyAndFormat(packageJsonContentJSON));
  console.log(`${green("INFO:")} Set version ${underline(version)} for ${underline(pkg)}\n`);
}

await updateMainPackage();

function getJson(path) {
  try {
    const packageJsonContentRaw = readFileSync(path, "utf-8");
    const packageJsonContentJSON = JSON.parse(packageJsonContentRaw);

    return packageJsonContentJSON;
  } catch {
    return null;
  }
}

async function stringifyAndFormat(json) {
  return format(JSON.stringify(json, null, 2), { parser: "json" });
}

async function updateMainPackage() {
  const packageJsonPath = join(process.cwd(), "package.json");

  const packageJsonContentJSON = getJson(packageJsonPath);
  packageJsonContentJSON.version = version;

  writeFileSync(packageJsonPath, await stringifyAndFormat(packageJsonContentJSON));
  console.log(
    `${green("INFO:")} Set version ${underline(version)} for ${underline("snailycad")}\n`,
  );
}

process.exit();
