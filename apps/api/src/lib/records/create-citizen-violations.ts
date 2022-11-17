import type { cad } from "@snailycad/types";
import { BadRequest } from "@tsed/exceptions";
import { upsertRecord } from "./upsert-record";
import type { z } from "zod";
import type { CREATE_TICKET_SCHEMA } from "@snailycad/schemas";

interface Options {
  cad: cad;
  data: z.infer<typeof CREATE_TICKET_SCHEMA>[];
  citizenId: string;
}

export async function createCitizenViolations(options: Options) {
  try {
    await Promise.all(
      options.data.map((violation) => {
        upsertRecord({
          data: { ...violation, citizenId: options.citizenId },
          officer: null,
          recordId: null,
          cad: options.cad,
        });
      }),
    );
  } catch {
    throw new BadRequest("errorCreatingViolations");
  }
}
