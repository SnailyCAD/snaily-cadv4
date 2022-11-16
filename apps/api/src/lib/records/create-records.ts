import type { cad } from "@snailycad/types";
import { BadRequest } from "@tsed/exceptions";
import { upsertRecord } from "./upsert-record";

export async function createViolations(cad: cad, violations: any[]) {
  try {
    await Promise.all(
      violations.map((violation) => {
        upsertRecord({ data: violation, officer: null, recordId: null, cad });
      }),
    );
  } catch {
    throw new BadRequest("errorCreatingViolations");
  }
}
