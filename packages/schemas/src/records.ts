import { z } from "zod";

export const CREATE_TICKET_SCHEMA = z.object({
  type: z
    .string()
    .min(2)
    .max(255)
    .regex(/ARREST_REPORT|TICKET|WRITTEN_WARNING/),
  citizenId: z.string().min(2).max(255),
  citizenName: z.string().min(2).max(255),
  violations: z.array(z.any()).min(1),
  postal: z.string().min(1).max(255),
  notes: z.string(),
});

export const CREATE_WARRANT_SCHEMA = z.object({
  citizenId: z.string().min(2).max(255),
  status: z
    .string()
    .min(1)
    .max(255)
    .regex(/ACTIVE|INACTIVE/),
  description: z.string(),
});
