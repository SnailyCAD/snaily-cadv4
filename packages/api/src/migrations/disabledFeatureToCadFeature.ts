import { prisma } from "lib/prisma";
import { Feature } from "@prisma/client";

const FEATURES: Feature[] = Object.values(Feature);

export async function disabledFeatureToCadFeature() {
  const cad = await prisma.cad.findFirst({ select: { disabledFeatures: true, id: true } });
  if (!cad) return;

  const disabledFeatures = cad.disabledFeatures ?? [];

  for (const feature of FEATURES) {
    const isDisabled = disabledFeatures.includes(feature);

    console.log({ isDisabled, feature });

    const createUpdateData = {
      isEnabled: !isDisabled,
      feature,
      cadId: cad.id,
    };

    await prisma.cadFeature.upsert({
      where: { feature },
      create: createUpdateData,
      update: createUpdateData,
    });

    await prisma.cad.updateMany({
      data: { disabledFeatures: [] },
    });
  }
}
