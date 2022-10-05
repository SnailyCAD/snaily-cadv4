import { z } from "zod";
import { VEHICLE_SCHEMA } from "./vehicles";
import { WEAPON_SCHEMA } from "./weapons";

export const IMPORT_CITIZENS_SCHEMA = z.object({
  userId: z.string().max(255).nullable().optional(),
  name: z.string().min(1).max(255),
  surname: z.string().min(1).max(255),
  gender: z.string().min(1).max(255),
  ethnicity: z.string().min(1).max(255),
  dateOfBirth: z
    .date()
    .min(new Date(1900, 0, 1))
    .max(new Date())
    .describe("ISO format")
    .or(z.string().min(2)),
  address: z.string().max(255).nullable().optional(),
  eyeColor: z.string().max(255).nullable().optional(),
  hairColor: z.string().max(255).nullable().optional(),
  height: z.string().max(255).nullable().optional(),
  weight: z.string().max(255).nullable().optional(),
  driversLicenseId: z.string().max(255).nullable().optional(),
  weaponLicenseId: z.string().max(255).nullable().optional(),
  pilotLicenseId: z.string().max(255).nullable().optional(),
  driversLicenseCategoryIds: z.array(z.string()).nullable().optional(),
  pilotLicenseCategoryIds: z.array(z.string()).nullable().optional(),
  waterLicenseCategoryIds: z.array(z.string()).nullable().optional(),
  firearmLicenseCategoryIds: z.array(z.string()).nullable().optional(),
  flags: z.array(z.string()).nullable().optional(),
  postal: z.string().nullable().optional(),
  phoneNumber: z.string().nullable().optional(),
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
