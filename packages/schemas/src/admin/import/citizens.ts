import { z } from "zod";
import { VEHICLE_SCHEMA } from "./vehicles";
import { WEAPON_SCHEMA } from "./weapons";

export const IMPORT_CITIZENS_SCHEMA = z.object({
  name: z.string().min(1).max(255),
  surname: z.string().min(1).max(255),
  gender: z.string().min(1).max(255),
  ethnicity: z.string().min(1).max(255),
  dateOfBirth: z.date().or(z.string().min(2)),
  address: z.string().max(255).nullable().optional(),
  eyeColor: z.string().max(255).nullable().optional(),
  hairColor: z.string().max(255).nullable().optional(),
  height: z.string().max(255).nullable().optional(),
  weight: z.string().max(255).nullable().optional(),
  vehicles: z
    .array(VEHICLE_SCHEMA.omit({ ownerId: true }))
    .optional()
    .nullable(),
  weapons: z
    .array(WEAPON_SCHEMA.omit({ ownerId: true }))
    .optional()
    .nullable(),
});

export const IMPORT_CITIZENS_ARR = z.array(IMPORT_CITIZENS_SCHEMA).min(1);
