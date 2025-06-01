import { z } from "zod";

export const CAD_SETTINGS_SCHEMA = z.object({
  name: z.string().min(2).max(255),
  areaOfPlay: z.string().max(255),
  steamApiKey: z.string().max(255),
  towWhitelisted: z.boolean().optional(),
  taxiWhitelisted: z.boolean().optional(),
  whitelisted: z.boolean().optional(),
  roleplayEnabled: z.boolean().optional(),
  registrationCode: z.string().max(255).optional(),
  businessWhitelisted: z.boolean().optional(),
  image: z.any().nullish(),
  timeZone: z.string().nullish(),
  authScreenBgImageId: z.any().or(z.string()).optional(),
  authScreenHeaderImageId: z.any().or(z.string()).optional(),
  cadOGDescription: z.string().nullish(),
});

export const LIVE_MAP_SETTINGS = z.object({
  liveMapURL: z.string().nullable(),
  liveMapURLs: z
    .array(z.object({ url: z.string().url(), name: z.string().min(2), id: z.string().optional() }))
    .nullable(),
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
  call911InactivityTimeout: z.number().gte(10).nullish(),
  incidentInactivityTimeout: z.number().gte(10).nullish(),
  unitInactivityTimeout: z.number().gte(10).nullish(),
  activeDispatchersInactivityTimeout: z.number().gte(10).nullish(),
  boloInactivityTimeout: z.number().gte(10).nullish(),
  activeWarrantsInactivityTimeout: z.number().gte(10).nullish(),
  jailTimeScaling: z
    .string()
    .regex(/HOURS|MINUTES|SECONDS/)
    .nullable()
    .optional(),
  driversLicenseTemplate: z.string().nullable(),
  driversLicenseNumberLength: z.number().finite().nullable(),
  pilotLicenseTemplate: z.string().nullable(),
  pilotLicenseNumberLength: z.number().finite().nullable(),
  pilotLicenseMaxPoints: z.number().finite().nullable(),
  fishingLicenseTemplate: z.string().nullable(),
  fishingLicenseNumberLength: z.number().finite().nullable(),
  fishingLicenseMaxPoints: z.number().finite().nullable(),
  waterLicenseTemplate: z.string().nullable(),
  waterLicenseMaxPoints: z.number().finite().nullable(),
  waterLicenseNumberLength: z.number().finite().nullable(),
  huntingLicenseTemplate: z.string().nullable(),
  huntingLicenseNumberLength: z.number().finite().nullable(),
  huntingLicenseMaxPoints: z.number().finite().nullable(),
  driversLicenseMaxPoints: z.number().finite().nullable(),
  weaponLicenseMaxPoints: z.number().finite().nullable(),
  weaponLicenseTemplate: z.string().nullable(),
  weaponLicenseNumberLength: z.number().finite().nullable(),
  signal100RepeatAmount: z.number().finite().nullable(),
  signal100RepeatIntervalMs: z.number().finite().nullable(),
});

export const BLACKLISTED_WORD_SCHEMA = z.array(
  z.object({
    word: z.string().min(1),
  }),
);

export const DISCORD_SETTINGS_SCHEMA = z.object({
  adminRoles: z.array(z.any()).nullish(),
  leoRoles: z.array(z.any()).nullish(),
  emsFdRoles: z.array(z.any()).nullish(),
  leoSupervisorRoles: z.array(z.any()).nullish(),
  dispatchRoles: z.array(z.any()).nullish(),
  towRoles: z.array(z.any()).nullish(),
  taxiRoles: z.array(z.any()).nullish(),
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
  /CALL_911|BOLO|UNIT_STATUS|PANIC_BUTTON|VEHICLE_IMPOUNDED|CITIZEN_RECORD|WARRANTS|BLEETER_POST|CITIZEN_DECLARED_DEAD|USER_WHITELIST_STATUS|DEPARTMENT_WHITELIST_STATUS|LEO_INCIDENT_CREATED|EMS_FD_INCIDENT_CREATED/;

export const DISCORD_WEBHOOK = z.object({
  id: z.string().max(255).nullish(),
  extraMessage: z.string().nullish(),
  type: z.string().regex(DISCORD_WEBHOOK_TYPE),
});

export const RAW_WEBHOOK = DISCORD_WEBHOOK.omit({ extraMessage: true }).extend({
  url: z.string().nullish(),
});

export const DISCORD_WEBHOOKS_SCHEMA = z.record(
  z.string().regex(DISCORD_WEBHOOK_TYPE),
  DISCORD_WEBHOOK,
);

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
  features: z.array(
    z.object({ isEnabled: z.boolean(), feature: z.string(), extraFields: z.any() }),
  ),
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
