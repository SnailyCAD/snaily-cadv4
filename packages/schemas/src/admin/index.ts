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
  image: z.any().nullish(),
});

export const LIVE_MAP_SETTINGS = z.object({
  liveMapURL: z.string().nullable(),
});

export const API_TOKEN_SCHEMA = z.object({
  enabled: z.boolean(),
  token: z.string().nullish(),
});

export const CAD_MISC_SETTINGS_SCHEMA = z.object({
  cadOGDescription: z.string().nullish(),
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
  caseNumberTemplate: z.string().nullish(),
  maxOfficersPerUser: z.number().nullable(),
  authScreenBgImageId: z.any().or(z.string()).optional(),
  authScreenHeaderImageId: z.any().or(z.string()).optional(),
  inactivityTimeout: z.number().nullish(),
  call911InactivityTimeout: z.number().gte(1).nullish(),
  incidentInactivityTimeout: z.number().gte(1).nullish(),
  unitInactivityTimeout: z.number().gte(1).nullish(),
  activeDispatchersInactivityTimeout: z.number().gte(1).nullish(),
  boloInactivityTimeout: z.number().gte(1).nullish(),
  activeWarrantsInactivityTimeout: z.number().gte(1).nullish(),
  jailTimeScaling: z
    .string()
    .regex(/HOURS|MINUTES|SECONDS/)
    .nullable()
    .optional(),
  driversLicenseTemplate: z.string().nullable(),
  pilotLicenseTemplate: z.string().nullable(),
  weaponLicenseTemplate: z.string().nullable(),
  waterLicenseTemplate: z.string().nullable(),
});

export const DISCORD_SETTINGS_SCHEMA = z.object({
  adminRoles: z.array(z.any()).nullish(),
  leoRoles: z.array(z.any()).nullish(),
  emsFdRoles: z.array(z.any()).nullish(),
  leoSupervisorRoles: z.array(z.any()).nullish(),
  dispatchRoles: z.array(z.any()).nullish(),
  towRoles: z.array(z.any()).nullish(),
  taxiRoles: z.array(z.any()).nullish(),
  adminRoleId: z.string().nullish(),
  whitelistedRoleId: z.string().nullish(),
  courthouseRoles: z.array(z.any()).nullish(),

  adminRolePermissions: z.array(z.string()).nullish(),
  leoRolePermissions: z.array(z.string()).nullish(),
  leoSupervisorRolePermissions: z.array(z.string()).nullish(),
  emsFdRolePermissions: z.array(z.string()).nullish(),
  dispatchRolePermissions: z.array(z.string()).nullish(),
  towRolePermissions: z.array(z.string()).nullish(),
  taxiRolePermissions: z.array(z.string()).nullish(),
  courthouseRolePermissions: z.array(z.string()).nullish(),
});

/** discord webhooks */
const DISCORD_WEBHOOK_TYPE =
  /CALL_911|BOLO|UNIT_STATUS|PANIC_BUTTON|VEHICLE_IMPOUNDED|CITIZEN_RECORD|WARRANTS/;

export const DISCORD_WEBHOOK = z.object({
  id: z.string().max(255).nullish(),
  extraMessage: z.string().nullish(),
  type: z.string().regex(DISCORD_WEBHOOK_TYPE),
});

export const RAW_WEBHOOK = DISCORD_WEBHOOK.omit({ extraMessage: true }).extend({
  url: z.string().nullish(),
});

export const DISCORD_WEBHOOKS_SCHEMA = z.object({
  call911Webhook: DISCORD_WEBHOOK,
  statusesWebhook: DISCORD_WEBHOOK,
  panicButtonWebhook: DISCORD_WEBHOOK,
  boloWebhook: DISCORD_WEBHOOK,
  vehicleImpoundedWebhook: DISCORD_WEBHOOK,
  citizenRecordsWebhook: DISCORD_WEBHOOK,
  warrantsWebhook: DISCORD_WEBHOOK,
});

export const RAW_WEBHOOKS_SCHEMA = z.object({
  call911Webhook: RAW_WEBHOOK,
  statusesWebhook: RAW_WEBHOOK,
  panicButtonWebhook: RAW_WEBHOOK,
  boloWebhook: RAW_WEBHOOK,
  vehicleImpoundedWebhook: RAW_WEBHOOK,
  citizenRecordsWebhook: RAW_WEBHOOK,
  warrantsWebhook: RAW_WEBHOOK,
});

export const UPDATE_DEFAULT_PERMISSIONS_SCHEMA = z.object({
  defaultPermissions: z.array(z.string()),
});

export const DISABLED_FEATURES_SCHEMA = z.object({
  features: z.array(z.object({ isEnabled: z.boolean(), feature: z.string() })),
});

export const BAN_SCHEMA = z.object({
  reason: z.string().min(2).max(255),
});

export const UPDATE_USER_SCHEMA = z.object({
  username: z
    .string()
    .min(3)
    .max(255)
    .regex(/^([a-z_.\d]+)*[a-z\d]+$/i),
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

export const ROLES_SCHEMA = z.object({
  roles: z.array(z.any()),
});

const CUSTOM_FIELD_CATEGORY = /CITIZEN|WEAPON|VEHICLE/;
export const CUSTOM_FIELDS_SCHEMA = z.object({
  name: z.string().min(2),
  category: z.string().regex(CUSTOM_FIELD_CATEGORY),
  citizenEditable: z.boolean(),
});

export const CUSTOM_ROLE_SCHEMA = z.object({
  name: z.string().min(2),
  icon: z.any(),
  permissions: z.array(z.any()).min(1),
  discordRoleId: z.string().nullish(),
});
