import { z } from "zod";

const VIOLATION = z.object({
  fine: z.number().nullable().optional(),
  jailTime: z.number().nullable().optional(),
  bail: z.number().nullable().optional(),
  counts: z.number().nullable().optional(),
  // optional on client, required on server
  penalCodeId: z.string().optional(),
});

export const SEIZED_ITEM_SCHEMA = z.object({
  illegal: z.boolean().nullable().optional(),
  item: z.string().min(1),
  quantity: z.number().nullable().optional(),
});

const recordTypeRegex = /ARREST_REPORT|TICKET|WRITTEN_WARNING/;
export const CREATE_TICKET_SCHEMA = z.object({
  type: z.string().min(2).max(255).regex(recordTypeRegex),
  citizenId: z.string().min(2).max(255),
  violations: z.array(VIOLATION).min(1),
  seizedItems: z.array(SEIZED_ITEM_SCHEMA).optional(),
  postal: z.string().min(1).max(255),
  notes: z.string().nullable().optional(),
  paymentStatus: z
    .string()
    .regex(/PAID|UNPAID/)
    .optional()
    .nullable(),
});

export const CREATE_WARRANT_SCHEMA = z.object({
  citizenId: z.string().min(2).max(255),
  status: z
    .string()
    .min(1)
    .max(255)
    .regex(/ACTIVE|INACTIVE/),
  description: z.string(),
  assignedOfficers: z.array(z.any()).nullable().optional(),
});

export const UPDATE_WARRANT_SCHEMA = CREATE_WARRANT_SCHEMA.pick({
  status: true,
  assignedOfficers: true,
}).extend({
  citizenId: z.string().min(2).max(255).nullable().optional(),
  description: z.string().nullable().optional(),
});
