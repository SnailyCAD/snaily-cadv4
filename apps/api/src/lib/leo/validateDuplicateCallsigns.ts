import { type Prisma } from "@prisma/client";
import { BadRequest } from "@tsed/exceptions";
import { prisma } from "lib/data/prisma";

interface Options {
  unitId?: string;
  userId?: string;
  type: "leo" | "ems-fd" | "combined-leo" | "combined-ems-fd";
  departmentId: string;
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

  const NOT: Partial<Prisma.OfficerWhereInput>[] = [];
  if (options.unitId) {
    NOT.push({ id: options.unitId });
  }
  if (options.userId) {
    NOT.push({ userId: options.userId });
  }

  // @ts-expect-error properties for this function are the same.
  const existing = await prisma[t].count({
    where: {
      departmentId: options.departmentId,
      callsign: options.callsign1,
      callsign2: options.callsign2,
      NOT,
    },
  });

  if (existing) {
    throw new BadRequest("unitCallsignInUse");
  }
}
