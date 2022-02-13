import { prisma } from "lib/prisma";

export async function createWarningApplicable(body: any): Promise<{
  warningApplicableId?: string;
  warningNotApplicableId?: string;
}> {
  let id;
  if (body.warningApplicable) {
    const fines = parsePenalCodeValues(body.fines);

    const data = await prisma.warningApplicable.create({
      data: {
        fines,
      },
    });

    id = data.id;
  } else {
    const fines = parsePenalCodeValues(body.fines);
    const prisonTerm = parsePenalCodeValues(body.prisonTerm);
    const bail = parsePenalCodeValues(body.bail);

    const data = await prisma.warningNotApplicable.create({
      data: {
        fines,
        prisonTerm,
        bail,
      },
    });

    id = data.id;
  }

  const key = body.warningApplicable ? "warningApplicableId" : "warningNotApplicableId";

  return {
    [key]: id,
  };
}

function parsePenalCodeValues(arr: unknown): [number, number] | [] {
  if (!Array.isArray(arr)) {
    return [];
  }

  const [min, max] = arr;
  return [parseInt(min), parseInt(max)].filter(Boolean) as [number, number];
}
