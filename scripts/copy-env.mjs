import { one } from "copy";
import { join } from "node:path";

const ENV_FILE_PATH = join(process.cwd(), ".env");
const CLIENT_PACKAGE_PATH = join(process.cwd(), "packages", "client");

async function copyEnv() {
  try {
    one(ENV_FILE_PATH, CLIENT_PACKAGE_PATH, (error) => {
      if (error) {
        console.log({ error });
        return;
      }

      console.log("✅ copied .env");
    });
  } catch (e) {
    console.log({ e });
  }
}

copyEnv();
