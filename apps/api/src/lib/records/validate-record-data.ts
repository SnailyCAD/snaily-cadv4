import { Feature, PenalCode, WarningApplicable, WarningNotApplicable } from "@prisma/client";
import { isFeatureEnabled } from "lib/cad";
import { prisma } from "lib/data/prisma";

interface Options {
  penalCodeId?: string;
  fine?: number | null;
  jailTime?: number | null;
  bail?: number | null;
  counts?: number | null;
  ticketId: string;
  cad: { features?: Record<Feature, boolean> };
}

type Return = Options & {
  errors: Record<string, { message: string; data: any }>;
  penalCode: PenalCode & {
    warningApplicable: WarningApplicable | null;
    warningNotApplicable: WarningNotApplicable | null;
  };
};

export async function validateRecordData(options: Options): Promise<Return> {
  const errors: Record<string, { message: string; data: any }> = {};

  if (!options.penalCodeId) {
    errors["violations"] = { message: "No penalCodeId provided", data: {} };
    // @ts-expect-error - we're immediately returning the errors here
    return { errors, ...options };
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
    errors["violations"] = {
      message: "Penal code not found with provided id",
      data: { id: options.penalCodeId },
    };

    // @ts-expect-error - we're immediately returning the errors here
    return { errors, ...options };
  }

  const minFinesArr = [
    penalCode.warningNotApplicable?.fines[0],
    penalCode.warningApplicable?.fines[0],
  ];
  const maxFinesArr = [
    penalCode.warningNotApplicable?.fines[1],
    penalCode.warningApplicable?.fines[1],
  ];

  const minFine = getMinOrMax(minFinesArr, "min") ?? 0;
  const maxFine = getMinOrMax(maxFinesArr, "max") ?? minFine;

  const minMaxFines = [minFine, maxFine];

  const minMaxPrisonTerm = penalCode.warningNotApplicable?.prisonTerm ?? [];
  const minMaxBail = (isBailEnabled && penalCode.warningNotApplicable?.bail) || [];
  const minMaxCounts = [1, 10] as [number, number];

  if (options.counts && !isCorrect(minMaxCounts, options.counts)) {
    const name = `violations.${options.penalCodeId}.counts`;

    errors[name] = {
      message: "counts_invalidDataReceived",
      data: { min: minMaxPrisonTerm[0] || 0, max: minMaxPrisonTerm[1] || 0 },
    };
  }

  // these if statements could be cleaned up?..
  if (options.fine && exists(minMaxFines) && !isCorrect(minMaxFines, options.fine)) {
    const name = `violations.${options.penalCodeId}.fine`;

    errors[name] = {
      message: "fine_invalidDataReceived",
      data: { min: minMaxFines[0] || 0, max: minMaxFines[1] || 0 },
    };
  }

  if (
    options.jailTime &&
    exists(minMaxPrisonTerm) &&
    !isCorrect(minMaxPrisonTerm, options.jailTime)
  ) {
    const name = `violations.${options.penalCodeId}.jailTime`;

    errors[name] = {
      message: "jailTime_invalidDataReceived",
      data: { min: minMaxPrisonTerm[0] || 0, max: minMaxPrisonTerm[1] || 0 },
    };
  }

  if (isBailEnabled && options.bail && exists(minMaxBail) && !isCorrect(minMaxBail, options.bail)) {
    const name = `violations.${options.penalCodeId}.bail`;

    errors[name] = {
      message: "bail_invalidDataReceived",
      data: { min: minMaxBail[0] || 0, max: minMaxBail[1] || 0 },
    };
  }

  return { ...options, errors, penalCode };
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

function getMinOrMax(arr: (number | undefined)[], type: "min" | "max") {
  const [min1, min2] = arr;

  if (min1 && min2) {
    return Math[type](min1, min2);
  }

  if (!min1 && !min2) {
    return null;
  }

  if (!min1 && min2) {
    return min2;
  }

  if (!min2 && min1) {
    return min1;
  }

  return null;
}

function exists(values: (number | undefined)[]): values is [number, number] {
  return values.every((v) => typeof v !== "undefined");
}
