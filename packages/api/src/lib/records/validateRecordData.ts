import type { PenalCode, WarningApplicable, WarningNotApplicable } from "@prisma/client";
import { BadRequest, NotFound } from "@tsed/exceptions";
import { prisma } from "lib/prisma";

interface Options {
  penalCodeId?: string;
  fine?: number | null;
  jailTime?: number | null;
  bail?: number | null;
  ticketId: string;
}

type Return = Options & {
  penalCode: PenalCode & {
    warningApplicable: WarningApplicable | null;
    warningNotApplicable: WarningNotApplicable | null;
  };
};

export async function validateRecordData(item: Options): Promise<Return> {
  if (!item.penalCodeId) {
    return handleBadRequest(new BadRequest("no penalCodeId provided"), item.ticketId);
  }

  /** validate the penalCode data */
  const penalCode = await prisma.penalCode.findUnique({
    where: { id: item.penalCodeId },
    include: { warningApplicable: true, warningNotApplicable: true },
  });

  if (!penalCode) {
    return handleBadRequest(new NotFound("penalCodeNotFound"), item.ticketId);
  }

  const minMaxFines =
    penalCode.warningApplicable?.fines ?? penalCode?.warningNotApplicable?.fines ?? [];
  const minMaxPrisonTerm = penalCode.warningNotApplicable?.prisonTerm ?? [];
  const minMaxBail = penalCode.warningNotApplicable?.bail ?? [];

  // these if statements could be cleaned up?..
  if (item.fine && exists(minMaxFines) && !isCorrect(minMaxFines, item.fine)) {
    return handleBadRequest(new BadRequest("fine_invalidDataReceived"), item.ticketId);
  }

  if (item.jailTime && exists(minMaxPrisonTerm) && !isCorrect(minMaxPrisonTerm, item.jailTime)) {
    return handleBadRequest(new BadRequest("jailTime_invalidDataReceived"), item.ticketId);
  }

  if (item.bail && exists(minMaxBail) && !isCorrect(minMaxBail, item.bail)) {
    return handleBadRequest(new BadRequest("bail_invalidDataReceived"), item.ticketId);
  }

  return { ...item, penalCode };
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
