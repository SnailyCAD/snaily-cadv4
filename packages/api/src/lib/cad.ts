import type { AutoSetUserProperties, cad } from "@prisma/client";
import { prisma } from "./prisma";

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
        ownerId: ownerId!,
      },
      include: {
        miscCadSettings: true,
        autoSetUserProperties: true,
      },
    });

    const miscSettings = await prisma.miscCadSettings.create({
      data: {},
    });

    cad = await prisma.cad.update({
      where: {
        id: cad.id,
      },
      data: {
        miscCadSettings: {
          connect: {
            id: miscSettings.id,
          },
        },
      },
      include: {
        miscCadSettings: true,
        autoSetUserProperties: true,
      },
    });
  }

  return cad as cad & { autoSetUserProperties: AutoSetUserProperties | null };
}
