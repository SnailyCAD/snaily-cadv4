import { PrismaClient } from "@prisma/client";
import { setDefaultCadFeatures } from "migrations/set-default-cad-features";

export const prisma = new PrismaClient({
  errorFormat: "colorless",
  log: ["info", "warn", "error"],
});

async function handleMigrations() {
  await Promise.all([setDefaultCadFeatures()]);
}

try {
  void handleMigrations();
  console.info("Successfully migrated.");
} catch (e) {
  console.error("Could not migrate: ", e);
}
