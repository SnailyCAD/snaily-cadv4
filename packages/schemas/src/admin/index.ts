import { z } from "zod";

const RANK_REGEX = /OWNER|ADMIN|MODERATOR|USER/;

export const CAD_SETTINGS_SCHEMA = z.object({
  name: z.string().min(2).max(255),
  areaOfPlay: z.string().max(255),
  steamApiKey: z.string().max(255),
  towWhitelisted: z.boolean(),
  whitelisted: z.boolean(),
  registrationCode: z.string().max(255),
});

export const DISABLED_FEATURES_SCHEMA = z.object({
  features: z.array(z.string().regex(/BLEETER|TOW|TAXI|COURTHOUSE|TRUCK_LOGS|AOP/)),
});

export const BAN_SCHEMA = z.object({
  reason: z.string().min(2).max(255),
});

export const UPDATE_USER_SCHEMA = z.object({
  rank: z.string().min(2).max(255).regex(RANK_REGEX),
  isLeo: z.boolean(),
  isEmsFd: z.boolean(),
  isDispatch: z.boolean(),
  isTow: z.boolean(),
  isSupervisor: z.boolean(),
  steamId: z.string().max(255),
});
