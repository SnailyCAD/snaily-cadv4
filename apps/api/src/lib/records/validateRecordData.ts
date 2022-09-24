import {
  CadFeature,
  Feature,
  PenalCode,
  WarningApplicable,
  WarningNotApplicable,
} from "@prisma/client";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { isFeatureEnabled } from "lib/cad";
import { prisma } from "lib/prisma";
import { ExtendedBadRequest } from "src/exceptions/ExtendedBadRequest";

interface Options {
  penalCodeId?: string;
  fine?: number | null;
  jailTime?: number | null;
  bail?: number | null;
  ticketId: string;
  cad: { features?: CadFeature[] };
}

type Return = Options & {
  penalCode: PenalCode & {
    warningApplicable: WarningApplicable | null;
    warningNotApplicable: WarningNotApplicable | null;
  };
};

export async function validateRecordData(options: Options): Promise<Return> {
  if (!options.penalCodeId) {
    return handleBadRequest(new BadRequest("no penalCodeId provided"), options.ticketId);
  }

  const isBailEnabled = isFeatureEnabled({
    features: options.cad.features,
    defaultReturn: true,
    feature: Feature.LEO_BAIL,
  });

  /** validate the penalCode data */
  const penalCode = await prisma.penalCode.findUnique({
    where: { id: options.penalCodeId },
    include: { warningApplicable: true, warningNotApplicable: true },
  });

  if (!penalCode) {
    return handleBadRequest(new NotFound("penalCodeNotFound"), options.ticketId);
  }

  const minFinesArr = [
    penalCode.warningNotApplicable?.fines[0] ?? 0,
    penalCode.warningApplicable?.fines[0] ?? 0,
  ] as number[];
  const maxFinesArr = [
    penalCode.warningNotApplicable?.fines[1] ?? 0,
    penalCode.warningApplicable?.fines[1] ?? 0,
  ] as number[];

  const minFine = Math.min(...minFinesArr);
  const maxFine = Math.max(...maxFinesArr);
  const minMaxFines = [minFine, maxFine];

  const minMaxPrisonTerm = penalCode.warningNotApplicable?.prisonTerm ?? [];
  const minMaxBail = (isBailEnabled && penalCode.warningNotApplicable?.bail) || [];

  // these if statements could be cleaned up?..
  if (options.fine && exists(minMaxFines) && !isCorrect(minMaxFines, options.fine)) {
    const name = `violations.${options.penalCodeId}.fine`;

    return handleBadRequest(
      new ExtendedBadRequest({
        [name]: {
          message: "fine_invalidDataReceived",
          data: { min: minMaxFines[0] || 0, max: minMaxFines[1] || 0 },
        },
      }),
      options.ticketId,
    );
  }

  if (
    options.jailTime &&
    exists(minMaxPrisonTerm) &&
    !isCorrect(minMaxPrisonTerm, options.jailTime)
  ) {
    const name = `violations.${options.penalCodeId}.jailTime`;

    return handleBadRequest(
      new ExtendedBadRequest({
        [name]: {
          message: "jailTime_invalidDataReceived",
          data: { min: minMaxPrisonTerm[0] || 0, max: minMaxPrisonTerm[1] || 0 },
        },
      }),
      options.ticketId,
    );
  }

  if (isBailEnabled && options.bail && exists(minMaxBail) && !isCorrect(minMaxBail, options.bail)) {
    const name = `violations.${options.penalCodeId}.bail`;

    return handleBadRequest(
      new ExtendedBadRequest({
        [name]: {
          message: "bail_invalidDataReceived",
          data: { min: minMaxBail[0] || 0, max: minMaxBail[1] || 0 },
        },
      }),
      options.ticketId,
    );
  }

  return { ...options, penalCode };
}

function isCorrect(minMax: [number, number], value: number) {
  const [min, max] = minMax;
  if (min < 0 || max < 0) {
    return false;
  }

  if (min === max) {
    return value === min;
  }

  return value >= min && value <= max;
}

function exists(values: (number | undefined)[]): values is [number, number] {
  return values.every((v) => typeof v !== "undefined");
}

/**
 * remove the created ticket when there's an error with linking the penal codes.
 */
async function handleBadRequest(error: Error, recordId: string): Promise<Return> {
  await prisma.record.delete({
    where: { id: recordId },
  });

  throw error;
}
