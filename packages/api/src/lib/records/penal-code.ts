import type { PenalCode } from "@prisma/client";
import type { PENAL_CODE_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/prisma";
import type { z } from "zod";

export async function upsertWarningApplicable(
  body: z.infer<typeof PENAL_CODE_SCHEMA>,
  penalCode?: Pick<PenalCode, "warningApplicableId" | "warningNotApplicableId">,
): Promise<{
  warningApplicableId?: string;
  warningNotApplicableId?: string;
}> {
  let id;
  if (body.warningApplicable) {
    const fines = parsePenalCodeValues(body.fines);

    const data = await prisma.warningApplicable.upsert({
      where: { id: String(penalCode?.warningApplicableId) },
      create: { fines },
      update: { fines },
    });

    id = data.id;
  } else {
    const fines = parsePenalCodeValues(body.fines);
    const prisonTerm = parsePenalCodeValues(body.prisonTerm);
    const bail = parsePenalCodeValues(body.bail);

    const data = await prisma.warningNotApplicable.upsert({
      where: { id: String(penalCode?.warningNotApplicableId) },
      create: { fines, prisonTerm, bail },
      update: { fines, prisonTerm, bail },
    });

    id = data.id;
  }

  const key = body.warningApplicable ? "warningApplicableId" : "warningNotApplicableId";
  const nullkey = body.warningApplicable ? "warningNotApplicableId" : "warningApplicableId";

  return {
    [key]: id,
    [nullkey]: null,
  };
}

function parsePenalCodeValues(arr: unknown): [number, number] | [] {
  if (!Array.isArray(arr)) {
    return [];
  }

  const [min, max] = arr;
  return [parseInt(min), parseInt(max)].filter(Boolean) as [number, number];
}
