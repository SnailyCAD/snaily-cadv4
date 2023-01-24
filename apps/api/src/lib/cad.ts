import type { AutoSetUserProperties, cad, CadFeature, Feature } from "@prisma/client";
import { prisma } from "./data/prisma";

interface Options {
  ownerId: string | null;
}

export async function findOrCreateCAD({ ownerId }: Options) {
  let cad = await prisma.cad.findFirst({
    include: {
      miscCadSettings: true,
      autoSetUserProperties: true,
    },
  });

  if (!cad) {
    cad = await prisma.cad.create({
      data: {
        name: "Rename",
        areaOfPlay: "Los Santos",
        ownerId: ownerId!,
      },
      include: {
        miscCadSettings: true,
        autoSetUserProperties: true,
      },
    });

    const miscSettings = await prisma.miscCadSettings.upsert({
      where: { id: String(cad.miscCadSettingsId) },
      create: {},
      update: {},
    });

    cad = await prisma.cad.update({
      where: {
        id: cad.id,
      },
      data: {
        miscCadSettings: { connect: { id: miscSettings.id } },
      },
      include: {
        miscCadSettings: true,
        autoSetUserProperties: true,
      },
    });
  }

  return cad as cad & { autoSetUserProperties: AutoSetUserProperties | null };
}

interface EnabledOptions {
  features?: CadFeature[];
  feature: Feature;
  defaultReturn: boolean;
}

export function isFeatureEnabled({ features, feature, defaultReturn }: EnabledOptions) {
  const feat = features?.find((v) => v.feature === feature);
  if (!feat) return defaultReturn;

  return feat.isEnabled;
}
