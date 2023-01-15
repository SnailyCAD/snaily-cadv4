import { prisma } from "lib/data/prisma";

export async function inactivityFilter() {
  const cad = await prisma.cad.findFirst({
    include: { miscCadSettings: true },
  });

  if (!cad?.miscCadSettings || typeof cad.miscCadSettings.inactivityTimeout !== "number") return;

  // has already been migrated
  if (cad.miscCadSettings.inactivityTimeout === -1) return;

  await prisma.miscCadSettings.update({
    where: {
      id: cad.miscCadSettings.id,
    },
    data: {
      inactivityTimeout: -1,
      call911InactivityTimeout: cad.miscCadSettings.inactivityTimeout,
      incidentInactivityTimeout: cad.miscCadSettings.inactivityTimeout,
      unitInactivityTimeout: cad.miscCadSettings.inactivityTimeout,
    },
  });
}
