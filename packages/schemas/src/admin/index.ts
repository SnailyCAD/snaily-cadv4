import { z } from "zod";

const RANK_REGEX = /OWNER|ADMIN|USER/;

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
  cadOGDescription: z.string().nullable().optional(),
  heightPrefix: z.string().max(255),
  weightPrefix: z.string().max(255),
  maxCitizensPerUser: z.number().nullable(),
  maxBusinessesPerCitizen: z.number().nullable(),
  maxDivisionsPerOfficer: z.number().nullable(),
  maxDepartmentsEachPerUser: z.number().nullable(),
  maxAssignmentsToIncidents: z.number().nullable(),
  maxAssignmentsToCalls: z.number().nullable(),
  maxPlateLength: z.number().min(1),
  pairedUnitTemplate: z.string().max(255).nullable(),
  callsignTemplate: z.string(),
  liveMapURL: z.string().nullable(),
  maxOfficersPerUser: z.number().nullable(),
  authScreenBgImageId: z.any().or(z.string()).optional(),
  authScreenHeaderImageId: z.any().or(z.string()).optional(),
  inactivityTimeout: z.number().optional().nullable(),
  jailTimeScaling: z
    .string()
    .regex(/HOURS|MINUTES|SECONDS/)
    .nullable()
    .optional(),
});

export const DISCORD_SETTINGS_SCHEMA = z.object({
  leoRoles: z.array(z.any()).nullable().optional(),
  emsFdRoles: z.array(z.any()).nullable().optional(),
  leoSupervisorRoles: z.array(z.any()).nullable().optional(),
  dispatchRoles: z.array(z.any()).nullable().optional(),
  towRoles: z.array(z.any()).nullable().optional(),
  taxiRoles: z.array(z.any()).nullable().optional(),
  adminRoleId: z.string().nullable().optional(),
  whitelistedRoleId: z.string().nullable().optional(),
  courthouseRoles: z.array(z.any()).nullable().optional(),

  adminRolePermissions: z.array(z.string()).nullable().optional(),
  leoRolePermissions: z.array(z.string()).nullable().optional(),
  leoSupervisorRolePermissions: z.array(z.string()).nullable().optional(),
  emsFdRolePermissions: z.array(z.string()).nullable().optional(),
  dispatchRolePermissions: z.array(z.string()).nullable().optional(),
  towRolePermissions: z.array(z.string()).nullable().optional(),
  taxiRolePermissions: z.array(z.string()).nullable().optional(),
  courthouseRolePermissions: z.array(z.string()).nullable().optional(),
});

/** discord webhooks */
const DISCORD_WEBHOOK_TYPE =
  /CALL_911|BOLO|UNIT_STATUS|PANIC_BUTTON|VEHICLE_IMPOUNDED|CITIZEN_RECORD/;

export const DISCORD_WEBHOOK = z.object({
  id: z.string().max(255).nullable().optional(),
  extraMessage: z.string().nullable().optional(),
  type: z.string().regex(DISCORD_WEBHOOK_TYPE),
});

export const DISCORD_WEBHOOKS_SCHEMA = z.object({
  call911Webhook: DISCORD_WEBHOOK,
  statusesWebhook: DISCORD_WEBHOOK,
  panicButtonWebhook: DISCORD_WEBHOOK,
  boloWebhook: DISCORD_WEBHOOK,
  vehicleImpoundedWebhook: DISCORD_WEBHOOK,
  citizenRecordsWebhook: DISCORD_WEBHOOK,
});

export const CAD_AUTO_SET_PROPERTIES = z.object({
  leo: z.boolean().nullable(),
  dispatch: z.boolean().nullable(),
  emsFd: z.boolean().nullable(),
});

export const DISABLED_FEATURES_SCHEMA = z.object({
  features: z.array(z.object({ isEnabled: z.boolean(), feature: z.string() })),
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

export const PERMISSIONS_SCHEMA = z.record(z.string());

const CUSTOM_FIELD_CATEGORY = /CITIZEN|WEAPON|VEHICLE/;
export const CUSTOM_FIELDS_SCHEMA = z.object({
  name: z.string().min(2),
  category: z.string().regex(CUSTOM_FIELD_CATEGORY),
  citizenEditable: z.boolean(),
});
