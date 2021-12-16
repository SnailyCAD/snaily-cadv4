import chalk from "chalk";

const [major, minor] = process.version.split(".").map((v) => {
  return parseInt(v.replace("v", ""));
});

const is16 = major >= 16;
const isDot6 = minor >= 6;
const isSupportedVersion = is16 && isDot6;
const versionText = chalk.bold(chalk.underline("16.6 or higher"));

if (!isSupportedVersion) {
  throw warn(
    `Unsupported Node.js version detected (${process.version}). SnailyCADv4 requires version ${versionText}.`,
  );
}

function warn(message) {
  console.warn(`${chalk.yellow("warn")} -`, message);
}
