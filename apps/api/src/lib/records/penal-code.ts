import { cad, Feature, PenalCode } from "@prisma/client";
import type { PENAL_CODE_SCHEMA } from "@snailycad/schemas";
import { prisma } from "lib/data/prisma";
import type { z } from "zod";
import { isFeatureEnabled } from "lib/cad";

type PickWarningPenalCode = Pick<PenalCode, "warningApplicableId" | "warningNotApplicableId">;

interface UpsertWarningApplicableOptions {
  body: z.infer<typeof PENAL_CODE_SCHEMA>;
  penalCode?: PickWarningPenalCode;
  cad: cad & { features?: Record<Feature, boolean> };
}

export async function upsertWarningApplicable(
  options: UpsertWarningApplicableOptions,
): Promise<PickWarningPenalCode> {
  const idData: PickWarningPenalCode = { warningApplicableId: null, warningNotApplicableId: null };

  if (options.body.warningApplicable) {
    const fines = parsePenalCodeValues(options.body.warningFines);

    const data = await prisma.warningApplicable.upsert({
      where: { id: String(options.penalCode?.warningApplicableId) },
      create: { fines },
      update: { fines },
    });

    idData.warningApplicableId = data.id;
  }

  if (options.body.warningNotApplicable) {
    const isBailEnabled = isFeatureEnabled({
      features: options.cad.features,
      defaultReturn: true,
      feature: Feature.LEO_BAIL,
    });

    const fines = parsePenalCodeValues(options.body.warningNotFines);
    const prisonTerm = parsePenalCodeValues(options.body.prisonTerm);
    const bail = isBailEnabled ? parsePenalCodeValues(options.body.bail) : undefined;

    const data = await prisma.warningNotApplicable.upsert({
      where: { id: String(options.penalCode?.warningNotApplicableId) },
      create: { fines, prisonTerm, bail },
      update: { fines, prisonTerm, bail },
    });

    idData.warningNotApplicableId = data.id;
  }

  return idData;
}

function parsePenalCodeValues(arr: unknown): [number, number] | [] {
  if (!Array.isArray(arr) || arr.length <= 0) {
    return [];
  }

  const [min, max] = arr;
  return [parseInt(min), parseInt(max)].filter((v) => !isNaN(v)) as [number, number];
}
