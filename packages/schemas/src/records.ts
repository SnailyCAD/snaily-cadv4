import { z } from "zod";
import { COURT_ENTRY_SCHEMA } from "./court";

const VIOLATION = z.object({
  fine: z.number().nullish(),
  jailTime: z.number().nullish(),
  bail: z.number().nullish(),
  counts: z.number().nullish(),
  // optional on client, required on server
  penalCodeId: z.string().optional(),
});

export const SEIZED_ITEM_SCHEMA = z.object({
  illegal: z.boolean().nullish(),
  item: z.string().min(1),
  quantity: z.number().nullish(),
});

const recordTypeRegex = /ARREST_REPORT|TICKET|WRITTEN_WARNING/;
export const CREATE_TICKET_SCHEMA = z.object({
  type: z.string().min(2).max(255).regex(recordTypeRegex),
  citizenId: z.string().min(2).max(255),
  violations: z.array(VIOLATION).min(1),
  seizedItems: z.array(SEIZED_ITEM_SCHEMA).optional(),
  postal: z.string().min(1).max(255),
  notes: z.string().nullish(),
  paymentStatus: z
    .string()
    .regex(/PAID|UNPAID/)
    .optional()
    .nullable(),
  courtEntry: COURT_ENTRY_SCHEMA.nullish(),
  address: z.string().nullish(),
  plateOrVin: z.string().nullish(),
  plateOrVinSearch: z.string().nullish(),
  vehicleId: z.string().nullish(),
  vehicleModel: z.string().nullish(),
  vehicleColor: z.string().nullish(),
  call911Id: z.string().nullish(),
  incidentId: z.string().nullish(),
});

export const CREATE_TICKET_SCHEMA_BUSINESS = CREATE_TICKET_SCHEMA.omit({ citizenId: true }).extend({
  businessId: z.string().min(2).max(255),
  type: z
    .string()
    .min(2)
    .max(255)
    .regex(/TICKET|WRITTEN_WARNING/),
});

export const CREATE_WARRANT_SCHEMA = z.object({
  citizenId: z.string().min(2).max(255),
  status: z
    .string()
    .min(1)
    .max(255)
    .regex(/ACTIVE|INACTIVE/),
  description: z.string(),
  assignedOfficers: z.array(z.any()).nullish(),
});

export const UPDATE_WARRANT_SCHEMA = CREATE_WARRANT_SCHEMA.pick({
  status: true,
  assignedOfficers: true,
}).extend({
  citizenId: z.string().min(2).max(255).nullish(),
  description: z.string().nullish(),
});
