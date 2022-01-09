import { PrismaClient } from "@prisma/client";
import { divisionToDivisions } from "src/migrations/divisionToDivisions";

export const prisma = new PrismaClient({ errorFormat: "pretty", log: ["info", "warn", "error"] });

async function handleMigrations() {
  await divisionToDivisions();
}

try {
  handleMigrations();
  console.log("Successfully migrated.");
} catch (e) {
  console.error("Could not migrate: ", e);
}
