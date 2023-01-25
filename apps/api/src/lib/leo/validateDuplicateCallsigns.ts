import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";

interface Options {
  unitId?: string;
  type: "leo" | "ems-fd" | "combined-leo" | "combined-ems-fd";
  callsign1: string;
  callsign2: string;
}

export async function validateDuplicateCallsigns(options: Options) {
  if (options.type === "combined-ems-fd" || options.type === "combined-leo") return;

  const prismaNames = {
    "ems-fd": "emsFdDeputy",
    leo: "officer",
  } as const;

  const t = prismaNames[options.type];

  // @ts-expect-error properties for this function are the same.
  const existing = await prisma[t].count({
    where: {
      AND: [{ callsign: options.callsign1 }, { callsign2: options.callsign2 }],
      NOT: options.unitId ? { id: options.unitId } : undefined,
    },
  });

  if (existing) {
    throw new BadRequest("unitCallsignInUse");
  }
}
