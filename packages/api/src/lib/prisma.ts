import { PrismaClient } from "@prisma/client";
import { divisionToDivisions } from "migrations/divisionToDivisions";
import { pairedSymbolToTemplate } from "migrations/pairedSymbolToTemplate";
import { xToXArrAll } from "migrations/xToXArr";
import { disabledFeatureToCadFeature } from "migrations/disabledFeatureToCadFeature";
import { officersToUnitsInvolved } from "migrations/officersToUnitsInvolved";
import { webhookIdToWebhooks } from "migrations/webhookIdToWebhooks";

export const prisma = new PrismaClient({
  errorFormat: "colorless",
  log: ["info", "warn", "error"],
});

async function handleMigrations() {
  await Promise.all([
    webhookIdToWebhooks(),
    divisionToDivisions(),
    pairedSymbolToTemplate(),
    xToXArrAll(),
    disabledFeatureToCadFeature(),
    officersToUnitsInvolved(),
  ]);
}

try {
  void handleMigrations();
  console.info("Successfully migrated.");
} catch (e) {
  console.error("Could not migrate: ", e);
}
