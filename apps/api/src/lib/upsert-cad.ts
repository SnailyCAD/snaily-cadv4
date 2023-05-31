import type { Feature } from "@prisma/client";
import type { createFeaturesObject } from "middlewares/is-enabled";
import { prisma } from "./data/prisma";

interface FindOrCreateCADOptions {
  ownerId: string;
}

export async function findOrCreateCAD(options: FindOrCreateCADOptions) {
  let cad = await prisma.cad.findFirst({
    include: { autoSetUserProperties: true },
  });

  if (!cad) {
    cad = await prisma.cad.create({
      data: {
        name: "Rename",
        areaOfPlay: "Los Santos",
        owner: { connect: { id: options.ownerId } },
      },
      include: { autoSetUserProperties: true },
    });

    const miscSettings = await prisma.miscCadSettings.upsert({
      where: { id: String(cad.miscCadSettingsId) },
      create: {},
      update: {},
    });

    cad = await prisma.cad.update({
      where: { id: cad.id },
      data: { miscCadSettings: { connect: { id: miscSettings.id } } },
      include: { autoSetUserProperties: true },
    });
  }

  return cad;
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
