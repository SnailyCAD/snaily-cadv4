import { PrismaClient } from "@prisma/client";
import { divisionToDivisions } from "migrations/divisionToDivisions";
import { pairedSymbolToTemplate } from "migrations/pairedSymbolToTemplate";

export const prisma = new PrismaClient({ errorFormat: "pretty", log: ["info", "warn", "error"] });

async function handleMigrations() {
  await Promise.all([divisionToDivisions(), pairedSymbolToTemplate()]);
}

try {
  handleMigrations();
  console.log("Successfully migrated.");
} catch (e) {
  console.error("Could not migrate: ", e);
}
