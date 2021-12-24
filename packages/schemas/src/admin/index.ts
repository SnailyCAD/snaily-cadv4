import { z } from "zod";

const RANK_REGEX = /OWNER|ADMIN|USER/;
const FEATURES_REGEX =
  /BLEETER|TOW|TAXI|COURTHOUSE|TRUCK_LOGS|AOP|BUSINESS|ALLOW_DUPLICATE_CITIZEN_NAMES|DISCORD_AUTH/;

export const CAD_SETTINGS_SCHEMA = z.object({
  name: z.string().min(2).max(255),
  areaOfPlay: z.string().max(255),
  steamApiKey: z.string().max(255),
  towWhitelisted: z.boolean(),
  whitelisted: z.boolean(),
  registrationCode: z.string().max(255),
});

export const CAD_MISC_SETTINGS_SCHEMA = z.object({
  heightPrefix: z.string().max(255),
  weightPrefix: z.string().max(255),
  maxCitizensPerUser: z.number().nullable(),
  maxBusinessesPerCitizen: z.number().nullable(),
  maxPlateLength: z.number().min(1),
  pairedUnitSymbol: z.string().max(255),
  liveMapURL: z.string().nullable(),
});

export const DISABLED_FEATURES_SCHEMA = z.object({
  features: z.array(z.string().regex(FEATURES_REGEX)),
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
