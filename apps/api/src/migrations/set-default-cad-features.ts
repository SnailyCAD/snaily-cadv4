import { prisma } from "lib/data/prisma";
import { Feature } from "@prisma/client";

const FEATURES: Feature[] = Object.values(Feature);

const DEFAULT_DISABLED_FEATURES: Partial<Record<Feature, { isEnabled: boolean }>> = {
  CUSTOM_TEXTFIELD_VALUES: { isEnabled: false },
  DMV: { isEnabled: false },
  CITIZEN_RECORD_APPROVAL: { isEnabled: false },
  COMMON_CITIZEN_CARDS: { isEnabled: false },
  STEAM_OAUTH: { isEnabled: false },
  CREATE_USER_CITIZEN_LEO: { isEnabled: false },
  ACTIVE_WARRANTS: { isEnabled: false },
  CITIZEN_DELETE_ON_DEAD: { isEnabled: false },
  WARRANT_STATUS_APPROVAL: { isEnabled: false },
  LICENSE_EXAMS: { isEnabled: false },
  CITIZEN_CREATION_RECORDS: { isEnabled: false },
  BUREAU_OF_FIREARMS: { isEnabled: false },
  CALL_911_APPROVAL: { isEnabled: false },
  FORCE_DISCORD_AUTH: { isEnabled: false },
  FORCE_STEAM_AUTH: { isEnabled: false },
  SIGNAL_100_CITIZEN: { isEnabled: false },
  FORCE_ACCOUNT_PASSWORD: { isEnabled: false },
  USER_DEFINED_CALLSIGN_COMBINED_UNIT: { isEnabled: false },
  REQUIRED_CITIZEN_IMAGE: { isEnabled: false },
  LEO_EDITABLE_CITIZEN_PROFILE: { isEnabled: false },
  ALLOW_MULTIPLE_UNITS_DEPARTMENTS_PER_USER: { isEnabled: false },
  CITIZEN_RECORD_PAYMENTS: { isEnabled: false },
};

/**
 * this migration will set the default features for the CAD.
 * **This will only run if there are no features in the database.**
 */
export async function setDefaultCadFeatures() {
  const cad = await prisma.cad.findFirst({ select: { id: true } });
  if (!cad) return;

  for (const feature of FEATURES) {
    const isEnabled = DEFAULT_DISABLED_FEATURES[feature]?.isEnabled ?? true;

    const existing = await prisma.cadFeature.findUnique({
      where: { feature },
    });

    if (existing) {
      continue;
    }

    await prisma.cadFeature.create({
      data: {
        isEnabled,
        feature,
        cadId: cad.id,
      },
    });
  }
}
