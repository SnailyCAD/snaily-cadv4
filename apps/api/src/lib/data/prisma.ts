import { PrismaClient } from "@prisma/client";
import { disabledFeatureToCadFeature } from "migrations/disabledFeatureToCadFeature";
import { inactivityFilter } from "migrations/inactivityFilter";

export const prisma = new PrismaClient({
  errorFormat: "colorless",
  log: ["info", "warn", "error"],
});

async function handleMigrations() {
  await Promise.all([disabledFeatureToCadFeature(), inactivityFilter()]);
}

try {
  void handleMigrations();
  console.info("Successfully migrated.");
} catch (e) {
  console.error("Could not migrate: ", e);
}
