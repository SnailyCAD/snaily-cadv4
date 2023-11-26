import { cp } from "node:fs/promises";
import { resolve } from "node:path";

const currentDir = new URL(import.meta.url).pathname;
const templatesDir = resolve(currentDir, "../../src/templates");

// The templates directory isn't copied over by SWC. Therefore, we have to do this manually.
cp(templatesDir, resolve(currentDir, "../../dist/templates"), { recursive: true });
