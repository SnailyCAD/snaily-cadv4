import { z } from "zod";

const RANK_REGEX = /OWNER|ADMIN|USER/;
const FEATURES_REGEX =
  /BLEETER|TOW|TAXI|COURTHOUSE|TRUCK_LOGS|AOP|BUSINESS|ALLOW_DUPLICATE_CITIZEN_NAMES|DISCORD_AUTH|WEAPON_REGISTRATION|CALLS_911|SOCIAL_SECURITY_NUMBERS|DISALLOW_TEXTFIELD_SELECTION|ACTIVE_DISPATCHERS|ALLOW_CITIZEN_UPDATE_LICENSE|ALLOW_REGULAR_LOGIN|ACTIVE_INCIDENTS|RADIO_CHANNEL_MANAGEMENT/;

export const CAD_SETTINGS_SCHEMA = z.object({
  name: z.string().min(2).max(255),
  areaOfPlay: z.string().max(255),
  steamApiKey: z.string().max(255),
  towWhitelisted: z.boolean(),
  taxiWhitelisted: z.boolean(),
  whitelisted: z.boolean(),
  roleplayEnabled: z.boolean(),
  registrationCode: z.string().max(255),
  businessWhitelisted: z.boolean(),
  image: z.any().optional().nullable(),
});

export const CAD_MISC_SETTINGS_SCHEMA = z.object({
  heightPrefix: z.string().max(255),
  weightPrefix: z.string().max(255),
  maxCitizensPerUser: z.number().nullable(),
  maxBusinessesPerCitizen: z.number().nullable(),
  maxDivisionsPerOfficer: z.number().nullable(),
  maxDepartmentsEachPerUser: z.number().nullable(),
  maxPlateLength: z.number().min(1),
  pairedUnitTemplate: z.string().max(255).nullable(),
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
  taxiRoleId: z.string().nullable().optional(),
  adminRoleId: z.string().nullable().optional(),
  whitelistedRoleId: z.string().nullable().optional(),
});

export const DISCORD_WEBHOOKS_SCHEMA = z.object({
  call911WebhookId: z.string().nullable().optional(),
  statusesWebhookId: z.string().nullable().optional(),
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
  isTaxi: z.boolean(),
  isSupervisor: z.boolean(),
  steamId: z.string().max(255),
  discordId: z.string().max(255),
});
