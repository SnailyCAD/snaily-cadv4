import { z } from "zod";
import { CREATE_OFFICER_SCHEMA } from "./leo";

export const SELECT_DEPUTY_SCHEMA = z.object({
  deputyId: z.string().min(2),
  vehicleId: z.string().nullish(),
  userDefinedCallsign: z.string().max(255).nullish(),
});

export const EMS_FD_DEPUTY_SCHEMA = CREATE_OFFICER_SCHEMA.omit({
  divisions: true,
}).extend({
  division: z.string().max(255).optional(),
});

export const CREATE_TEMPORARY_EMS_FD_DEPUTY_SCHEMA = EMS_FD_DEPUTY_SCHEMA.omit({
  citizenId: true,
  image: true,
  rank: true,
}).extend({
  name: z.string().min(2).max(255),
  surname: z.string().min(2).max(255),
  identifiers: z.array(z.string()).nullish(),
});

export const DOCTOR_VISIT_SCHEMA = z.object({
  citizenId: z.string().min(2).max(255),
  diagnosis: z.string(),
  medications: z.string(),
  conditions: z.string(),
  description: z.string(),
});
