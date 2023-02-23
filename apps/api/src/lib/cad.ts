import type { AutoSetUserProperties, cad, Feature } from "@prisma/client";
import type { createFeaturesObject } from "middlewares/is-enabled";
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
  features?: ReturnType<typeof createFeaturesObject> | Record<Feature, boolean>;
  feature: Feature;
  defaultReturn: boolean;
}

export function isFeatureEnabled({ features, feature, defaultReturn }: EnabledOptions) {
  const feat = features?.[feature];
  if (typeof feat === "undefined") return defaultReturn;

  return feat;
}
