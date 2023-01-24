import { prisma } from "lib/data/prisma";

export async function divisionToDivisions() {
  const officers = await prisma.officer.findMany({
    where: { divisionId: { not: null } },
  });

  await Promise.all(
    officers.map(async (officer) => {
      await prisma.officer.update({
        where: { id: officer.id },
        data: {
          division: { disconnect: true },
          divisions: {
            connect: { id: officer.divisionId! },
          },
        },
      });
    }),
  );
}
