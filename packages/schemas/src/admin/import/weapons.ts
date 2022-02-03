import { z } from "zod";

export const WEAPON_SCHEMA = z.object({
  modelId: z.string().min(2).max(255),
  ownerId: z.string().min(2).max(255),
  registrationStatusId: z.string().min(2).max(255),
});

export const WEAPON_SCHEMA_ARR = z.array(WEAPON_SCHEMA).min(1);
