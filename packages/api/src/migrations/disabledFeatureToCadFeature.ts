import { prisma } from "lib/prisma";
import { Feature } from "@prisma/client";

const FEATURES: Feature[] = [
  Feature.ACTIVE_DISPATCHERS,
  Feature.ACTIVE_INCIDENTS,
  Feature.ALLOW_CITIZEN_DELETION_BY_NON_ADMIN,
  Feature.ALLOW_CITIZEN_UPDATE_LICENSE,
  Feature.ALLOW_DUPLICATE_CITIZEN_NAMES,
  Feature.ALLOW_REGULAR_LOGIN,
  Feature.AOP,
  Feature.BLEETER,
  Feature.BUSINESS,
  Feature.CALLS_911,
  Feature.COURTHOUSE,
  Feature.DISCORD_AUTH,
  Feature.RADIO_CHANNEL_MANAGEMENT,
  Feature.SOCIAL_SECURITY_NUMBERS,
  Feature.TAXI,
  Feature.TOW,
  Feature.TRUCK_LOGS,
  Feature.WEAPON_REGISTRATION,
];

export async function disabledFeatureToCadFeature() {
  const cad = await prisma.cad.findFirst({ select: { disabledFeatures: true, id: true } });
  if (!cad) return;

  const disabledFeatures = cad.disabledFeatures ?? [];
  const transactions = [];

  for (const feature of FEATURES) {
    const isDisabled = disabledFeatures.includes(feature);

    console.log({ isDisabled, feature });

    const createUpdateData = {
      isEnabled: !isDisabled,
      feature,
      cadId: cad.id,
    };

    transactions.push(
      prisma.cadFeature.upsert({
        where: { feature },
        create: createUpdateData,
        update: createUpdateData,
      }),
    );
  }

  await prisma.$transaction(transactions);
}
