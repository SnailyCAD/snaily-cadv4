import { z } from "zod";
import { VEHICLE_SCHEMA } from "./vehicles";
import { WEAPON_SCHEMA } from "./weapons";

export const IMPORT_CITIZENS_SCHEMA = z.object({
  userId: z.string().max(255).nullish(),
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
  address: z.string().max(255).nullish(),
  eyeColor: z.string().max(255).nullish(),
  hairColor: z.string().max(255).nullish(),
  height: z.string().max(255).nullish(),
  weight: z.string().max(255).nullish(),
  driversLicenseId: z.string().max(255).nullish(),
  weaponLicenseId: z.string().max(255).nullish(),
  pilotLicenseId: z.string().max(255).nullish(),
  driversLicenseCategoryIds: z.array(z.string()).nullish(),
  pilotLicenseCategoryIds: z.array(z.string()).nullish(),
  waterLicenseCategoryIds: z.array(z.string()).nullish(),
  firearmLicenseCategoryIds: z.array(z.string()).nullish(),
  flags: z.array(z.string()).nullish(),
  postal: z.string().nullish(),
  phoneNumber: z.string().nullish(),
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
