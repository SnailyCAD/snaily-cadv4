import { prisma } from "lib/data/prisma";
import { Feature } from "@prisma/client";

const FEATURES: Feature[] = Object.values(Feature);
const DEPRECATED_FEATURES = [
  Feature.DL_EXAMS,
  Feature.WEAPON_EXAMS,
  Feature.DISALLOW_TEXTFIELD_SELECTION,
] as Feature[];

const DEFAULTS: Partial<Record<Feature, { isEnabled: boolean }>> = {
  CUSTOM_TEXTFIELD_VALUES: { isEnabled: false },
  DMV: { isEnabled: false },
  USER_API_TOKENS: { isEnabled: false },
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
};

export async function disabledFeatureToCadFeature() {
  const cad = await prisma.cad.findFirst({ select: { disabledFeatures: true, id: true } });
  if (!cad) return;

  const disabledFeatures = cad.disabledFeatures ?? [];

  for (const feature of FEATURES) {
    if (DEPRECATED_FEATURES.includes(feature)) {
      continue;
    }

    const isDisabled = disabledFeatures.includes(feature);
    const isEnabled = DEFAULTS[feature]?.isEnabled ?? !isDisabled;

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

    await prisma.cad.updateMany({
      data: { disabledFeatures: [] },
    });
  }
}
