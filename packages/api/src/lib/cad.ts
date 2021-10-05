import { cad } from ".prisma/client";
import { prisma } from "./prisma";

interface Options {
  ownerId: string | null;
}

export async function findOrCreateCAD({ ownerId }: Options) {
  let cad = await prisma.cad.findFirst();

  if (!cad) {
    cad = await prisma.cad.create({
      data: {
        name: "Rename",
        ownerId: ownerId!,
      },
    });
  }

  return cad as cad;
}
