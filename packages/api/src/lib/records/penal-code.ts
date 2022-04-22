import type { PenalCode } from "@prisma/client";
import type { PENAL_CODE_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/prisma";
import type { z } from "zod";

type PickWarningPenalCode = Pick<PenalCode, "warningApplicableId" | "warningNotApplicableId">;

export async function upsertWarningApplicable(
  body: z.infer<typeof PENAL_CODE_SCHEMA>,
  penalCode?: PickWarningPenalCode,
): Promise<PickWarningPenalCode> {
  const idData: PickWarningPenalCode = { warningApplicableId: null, warningNotApplicableId: null };

  if (body.warningApplicable) {
    const fines = parsePenalCodeValues(body.warningFines);

    const data = await prisma.warningApplicable.upsert({
      where: { id: String(penalCode?.warningApplicableId) },
      create: { fines },
      update: { fines },
    });

    idData.warningApplicableId = data.id;
  }

  if (body.warningNotApplicable) {
    const fines = parsePenalCodeValues(body.warningNotFines);
    const prisonTerm = parsePenalCodeValues(body.prisonTerm);
    const bail = parsePenalCodeValues(body.bail);

    const data = await prisma.warningNotApplicable.upsert({
      where: { id: String(penalCode?.warningNotApplicableId) },
      create: { fines, prisonTerm, bail },
      update: { fines, prisonTerm, bail },
    });

    idData.warningNotApplicableId = data.id;
  }

  return idData;
}

function parsePenalCodeValues(arr: unknown): [number, number] | [] {
  if (!Array.isArray(arr)) {
    return [];
  }

  const [min, max] = arr;
  return [parseInt(min), parseInt(max)].filter(Boolean) as [number, number];
}
