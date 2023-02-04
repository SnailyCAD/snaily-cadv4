import { bold, underline, yellow } from "colorette";

const [major, minor] = process.version.split(".").map((v) => {
  return parseInt(v.replace("v", ""));
});

const is16 = major >= 16;
const isDot6 = major === 16 ? minor >= 6 : !(major < 16);
const isSupportedVersion = is16 && isDot6;
const versionText = bold(underline("v16.6 or higher"));

if (!isSupportedVersion) {
  throw warn(
    `Unsupported Node.js version detected (${process.version}). SnailyCADv4 requires version ${versionText}. See https://docs.snailycad.org/docs/errors/invalid-node-version`,
  );
}

function warn(message) {
  console.warn(`${yellow("warn")} -`, message);
}
