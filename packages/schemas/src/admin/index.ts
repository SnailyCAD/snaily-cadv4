import { z } from "zod";

export const CAD_SETTINGS_SCHEMA = z.object({
  name: z.string().min(2).max(255),
  areaOfPlay: z.string().max(255),
  steamApiKey: z.string().max(255),
  towWhitelisted: z.boolean(),
  whitelisted: z.boolean(),
  registrationCode: z.string().min(2).max(255),
});

export const BAN_SCHEMA = z.object({
  reason: z.string().min(2).max(255),
});
