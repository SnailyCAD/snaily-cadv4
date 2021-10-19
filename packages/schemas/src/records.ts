import { z } from "zod";

export const CREATE_TICKET_SCHEMA = z.object({
  type: z
    .string()
    .min(2)
    .max(255)
    .regex(/ARREST_REPORT|TICKET|WRITTEN_WARNING/),
  citizenId: z.string().min(2).max(255),
  violations: z.array(z.any()),
  postal: z.string().min(1).max(255).nullable(),
  notes: z.string(),
});
