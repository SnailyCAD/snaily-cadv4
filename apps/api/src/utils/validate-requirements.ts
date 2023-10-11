// credits to Whitigol
// https://github.com/WhitigolProd/SnailyCAD-Manager/blob/main/src/scripts/utils/requirements.ts
import commandExists from "command-exists";
import { $log, drawTable } from "@tsed/logger";

$log.name = "SnailyCAD";
$log.level = "info";

$log.info("Checking requirements");

const commands = ["node", "npm", "pnpm", "git"];

export async function areRequiredCommandsInstalled() {
  const list = [];
  let failed = false;

  for (const command of commands) {
    const exists = await doesCommandExist(command);

    if (exists) {
      list.push({ command, icon: "✅ Yes" });
    } else {
      failed = true;
      list.push({ command, icon: "❌ No" });
    }
  }

  const table = drawTable(list, {
    header: {
      command: "Command",
      icon: "Is Installed?",
    },
  });

  console.log(`\n${table.trim()}\n`);

  if (failed) {
    process.exit(1);
  }
}

async function doesCommandExist(command: string) {
  return new Promise((resolve, reject) => {
    commandExists(command, (err, exists) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (err) {
        return reject(err);
      }

      if (!exists) {
        return resolve(false);
      }

      return resolve(true);
    });
  });
}
