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
  maxDepartmentsEachPerUser: z.number().nullable(),
  maxPlateLength: z.number().min(1),
  pairedUnitSymbol: z.string().max(255),
  callsignTemplate: z.string(),
  liveMapURL: z.string().nullable(),
  maxOfficersPerUser: z.number().nullable(),
  authScreenBgImageId: z.any().or(z.string()).optional(),
  authScreenHeaderImageId: z.any().or(z.string()).optional(),
});

export const DISCORD_SETTINGS_SCHEMA = z.object({
  leoRoleId: z.string().nullable().optional(),
  leoSupervisorRoleId: z.string().nullable().optional(),
  emsFdRoleId: z.string().nullable().optional(),
  dispatchRoleId: z.string().nullable().optional(),
  towRoleId: z.string().nullable().optional(),
  adminRoleId: z.string().nullable().optional(),
});

export const CAD_AUTO_SET_PROPERTIES = z.object({
  leo: z.boolean().nullable(),
  dispatch: z.boolean().nullable(),
  emsFd: z.boolean().nullable(),
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
  discordId: z.string().max(255),
});

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
});

export const IMPORT_CITIZENS_ARR = z.array(IMPORT_CITIZENS_SCHEMA).min(1);
