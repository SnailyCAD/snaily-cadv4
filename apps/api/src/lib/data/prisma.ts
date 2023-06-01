import { PrismaClient } from "@prisma/client";
import { pairedSymbolToTemplate } from "migrations/pairedSymbolToTemplate";
import { xToXArrAll } from "migrations/xToXArr";
import { disabledFeatureToCadFeature } from "migrations/disabledFeatureToCadFeature";
import { officersToUnitsInvolved } from "migrations/officersToUnitsInvolved";
import { inactivityFilter } from "migrations/inactivityFilter";
import { migrateLocales } from "migrations/migrateLocales";

export const prisma = new PrismaClient({
  errorFormat: "colorless",
  log: ["info", "warn", "error"],
});

async function handleMigrations() {
  await Promise.all([
    migrateLocales(),
    pairedSymbolToTemplate(),
    xToXArrAll(),
    disabledFeatureToCadFeature(),
    officersToUnitsInvolved(),
    inactivityFilter(),
  ]);
}

try {
  void handleMigrations();
  console.info("Successfully migrated.");
} catch (e) {
  console.error("Could not migrate: ", e);
}
