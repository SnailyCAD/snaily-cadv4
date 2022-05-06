import { Feature, cad, CadFeature } from "@prisma/client";
import { isFeatureEnabled } from "lib/cad";
import { prisma } from "lib/prisma";

interface Options {
  userId: string;
  cad: Partial<cad> & { features?: CadFeature[] };
}

export async function shouldCheckCitizenUserId({ cad, userId }: Options) {
  const isCommonCardsEnabled = isFeatureEnabled({
    defaultReturn: false,
    feature: Feature.COMMON_CITIZEN_CARDS,
    features: cad.features,
  });

  const officerCount = await prisma.officer.count({
    where: { userId },
  });
  const hasOfficers = officerCount >= 1;

  if (isCommonCardsEnabled && hasOfficers) return false;
  return true;
}
