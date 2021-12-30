import { z } from "zod";
import { IMGUR_REGEX } from "@snailycad/config";

export const CREATE_OFFICER_SCHEMA = z.object({
  department: z.string().min(2).max(255),
  callsign: z.string().min(1).max(255),
  callsign2: z.string().min(1).max(255),
  rank: z.string().max(255).nullable(),
  badgeNumber: z.number().min(1),
  division: z.string().min(2).max(255),
  image: z.string().regex(IMGUR_REGEX).optional(),
});

export const UPDATE_OFFICER_STATUS_SCHEMA = z.object({
  status: z.string().min(2).max(255),
});

export const SELECT_OFFICER_SCHEMA = z.object({
  officer: z.string().min(2).max(255),
});

export const LEO_INCIDENT_SCHEMA = z.object({
  description: z.string().min(2),
  firearmsInvolved: z.boolean(),
  injuriesOrFatalities: z.boolean(),
  arrestsMade: z.boolean(),
  officersInvolved: z.array(z.any()).min(0).optional(),
});
