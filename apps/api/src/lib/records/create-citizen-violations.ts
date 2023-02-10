import type { Feature } from "@prisma/client";
import { upsertRecord } from "./upsert-record";
import type { z } from "zod";
import type { CREATE_TICKET_SCHEMA } from "@snailycad/schemas";

interface Options {
  cad: { features?: Record<Feature, boolean> };
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
    /* empty */
  }
}
