import { prisma } from "lib/data/prisma";

export async function officersToUnitsInvolved() {
  const leoIncidents = await prisma.leoIncident.findMany({
    include: { officersInvolved: true },
  });

  for (const incident of leoIncidents) {
    if (!incident.officersInvolved.length) {
      continue;
    }

    for (const officer of incident.officersInvolved) {
      const { id } = await prisma.incidentInvolvedUnit.create({
        data: { officerId: officer.id },
      });

      await prisma.leoIncident.update({
        where: { id: incident.id },
        data: { unitsInvolved: { connect: { id } } },
      });
    }

    await prisma.leoIncident.update({
      where: { id: incident.id },
      data: {
        officersInvolved: { set: [] },
      },
    });
  }
}
