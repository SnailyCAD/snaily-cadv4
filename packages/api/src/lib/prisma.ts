import { PrismaClient } from "@prisma/client";
import { divisionToDivisions } from "migrations/divisionToDivisions";
import { pairedSymbolToTemplate } from "migrations/pairedSymbolToTemplate";
import { xToXArrAll } from "migrations/xToXArr";
import { disabledFeatureToCadFeature } from "migrations/disabledFeatureToCadFeature";
import { officersToUnitsInvolved } from "migrations/officersToUnitsInvolved";

export const prisma = new PrismaClient({
  errorFormat: "colorless",
  log: ["info", "warn", "error"],
});

async function handleMigrations() {
  await Promise.all([
    divisionToDivisions(),
    pairedSymbolToTemplate(),
    xToXArrAll(),
    disabledFeatureToCadFeature(),
    officersToUnitsInvolved(),
  ]);
}

try {
  handleMigrations();
  console.log("Successfully migrated.");
} catch (e) {
  console.error("Could not migrate: ", e);
}
