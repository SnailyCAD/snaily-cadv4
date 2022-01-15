import { z } from "zod";

const RANK_REGEX = /OWNER|ADMIN|USER/;
const FEATURES_REGEX =
  /BLEETER|TOW|TAXI|COURTHOUSE|TRUCK_LOGS|AOP|BUSINESS|ALLOW_DUPLICATE_CITIZEN_NAMES|DISCORD_AUTH|WEAPON_REGISTRATION|CALLS_911|SOCIAL_SECURITY_NUMBERS|DISALLOW_TEXTFIELD_SELECTION|ACTIVE_DISPATCHERS/;

export const CAD_SETTINGS_SCHEMA = z.object({
  name: z.string().min(2).max(255),
  areaOfPlay: z.string().max(255),
  steamApiKey: z.string().max(255),
  towWhitelisted: z.boolean(),
  whitelisted: z.boolean(),
  roleplayEnabled: z.boolean(),
  registrationCode: z.string().max(255),
  businessWhitelisted: z.boolean(),
  discordWebhookURL: z.string().optional(),
});

export const CAD_MISC_SETTINGS_SCHEMA = z.object({
  heightPrefix: z.string().max(255),
  weightPrefix: z.string().max(255),
  maxCitizensPerUser: z.number().nullable(),
  maxBusinessesPerCitizen: z.number().nullable(),
  maxDivisionsPerOfficer: z.number().nullable(),
  maxPlateLength: z.number().min(1),
  pairedUnitSymbol: z.string().max(255),
  callsignTemplate: z.string(),
  liveMapURL: z.string().nullable(),
  authScreenBgImageId: z.any().or(z.string()).optional(),
  authScreenHeaderImageId: z.any().or(z.string()).optional(),
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
