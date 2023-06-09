import type { Citizen } from "@prisma/client";
import type { SuspendedCitizenLicenses } from "@snailycad/types";
import { prisma } from "lib/data/prisma";

export async function setEndedSuspendedLicenses<
  T extends Citizen & { suspendedLicenses?: SuspendedCitizenLicenses | null },
>(citizens: T[]) {
  const transactions: {
    citizenId: string;
    suspendedLicenses: Partial<SuspendedCitizenLicenses>;
  }[] = [];

  const updatedCitizens = citizens.map((citizen) => {
    if (!citizen.suspendedLicenses) return citizen;

    const types = Object.keys(citizen.suspendedLicenses) as (keyof SuspendedCitizenLicenses)[];
    const toUpdateObj: Partial<SuspendedCitizenLicenses> = { ...citizen.suspendedLicenses };

    for (const type of types) {
      if (type.endsWith("LicenseTimeEnd")) {
        const timeEnd = citizen.suspendedLicenses[type];
        if (!timeEnd || typeof timeEnd !== "object") continue;
        const endTime = new Date(timeEnd).getTime();
        const current = new Date().getTime();

        if (current > endTime) {
          // @ts-expect-error this is fine. The key supports null here
          toUpdateObj[type] = null;
          const withoutTimeEnd = type.replace("TimeEnd", "");
          // @ts-expect-error this is fine. The key supports a boolean
          toUpdateObj[withoutTimeEnd] = false;
          transactions.push({ citizenId: citizen.id, suspendedLicenses: toUpdateObj });
          return { ...citizen, suspendedLicenses: toUpdateObj };
        }
      }
    }

    return citizen;
  });

  prisma.$transaction(
    transactions.map((transaction) =>
      prisma.citizen.update({
        where: { id: transaction.citizenId },
        data: { suspendedLicenses: { update: transaction.suspendedLicenses } },
      }),
    ),
  );

  return updatedCitizens;
}
