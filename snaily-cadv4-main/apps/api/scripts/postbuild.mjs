import { cp } from "node:fs/promises";
import { resolve } from "node:path";

const currentDir = process.cwd();
const templatesDir = resolve(currentDir, "src/templates");

// The templates directory isn't copied over by SWC. Therefore, we have to do this manually.
cp(templatesDir, resolve(currentDir, "dist/templates"), { recursive: true });
