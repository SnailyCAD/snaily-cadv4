import { prisma } from "lib/prisma";
import { Feature } from "@prisma/client";

const FEATURES: Feature[] = Object.values(Feature);

const DEFAULTS: Partial<Record<Feature, { isEnabled: boolean }>> = {
  CUSTOM_TEXTFIELD_VALUES: { isEnabled: false },
  DL_EXAMS: { isEnabled: false },
};

export async function disabledFeatureToCadFeature() {
  const cad = await prisma.cad.findFirst({ select: { disabledFeatures: true, id: true } });
  if (!cad) return;

  const disabledFeatures = cad.disabledFeatures ?? [];

  for (const feature of FEATURES) {
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
