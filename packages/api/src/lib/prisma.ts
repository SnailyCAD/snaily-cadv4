import { PrismaClient } from "@prisma/client";
import { divisionToDivisions } from "migrations/divisionToDivisions";
import { pairedSymbolToTemplate } from "migrations/pairedSymbolToTemplate";
import { leoRoleToLeoRoles } from "migrations/leoRoleToLeoRoles";
import { emsRoleToEmsRoles } from "migrations/emsRoleToEmsRoles";
import { disabledFeatureToCadFeature } from "migrations/disabledFeatureToCadFeature";

export const prisma = new PrismaClient({
  errorFormat: "colorless",
  log: ["info", "warn", "error"],
});

async function handleMigrations() {
  await Promise.all([
    divisionToDivisions(),
    pairedSymbolToTemplate(),
    leoRoleToLeoRoles(),
    emsRoleToEmsRoles(),
    disabledFeatureToCadFeature(),
  ]);
}

try {
  handleMigrations();
  console.log("Successfully migrated.");
} catch (e) {
  console.error("Could not migrate: ", e);
}
