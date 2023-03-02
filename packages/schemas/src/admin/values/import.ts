import { z } from "zod";

const LICENSE_TYPE_REGEX = /LICENSE|INSURANCE_STATUS|REGISTRATION_STATUS/;
export const BASE_VALUE_SCHEMA = z.object({
  value: z.string().min(1).max(255),
  licenseType: z.string().regex(LICENSE_TYPE_REGEX).nullish(),
  isDefault: z.boolean().nullish(),
  officerRankImageId: z.any().nullish(),
  officerRankDepartments: z.array(z.any()).nullish(),
  isDisabled: z.boolean().nullish(),
});
export const BASE_ARR = z.array(BASE_VALUE_SCHEMA).min(1);

export const HASH_SCHEMA = BASE_VALUE_SCHEMA.extend({
  hash: z.string().max(255).optional(),
  trimLevels: z.array(z.any()).nullish(),
});

export const HASH_SCHEMA_ARR = z.array(HASH_SCHEMA).min(1);

/** address */
export const ADDRESS_SCHEMA = BASE_VALUE_SCHEMA.extend({
  postal: z.string().nullish(),
  county: z.string().nullish(),
});

export const ADDRESS_SCHEMA_ARR = z.array(ADDRESS_SCHEMA);

/**
 * codes_10
 */
const SHOULD_DO_REGEX =
  /SET_OFF_DUTY|SET_ON_DUTY|SET_ASSIGNED|SET_STATUS|PANIC_BUTTON|ON_SCENE|EN_ROUTE|UNAVAILABLE/;
const TYPE_REGEX = /STATUS_CODE|SITUATION_CODE/;

export const CODES_10_SCHEMA = BASE_VALUE_SCHEMA.extend({
  shouldDo: z.string().regex(SHOULD_DO_REGEX),
  color: z.string().max(255).nullish(),
  type: z.string().regex(TYPE_REGEX).max(255),
  whatPages: z.array(z.any()).max(3).nullish(),
  departments: z.array(z.any()).nullish(),
});

export const CODES_10_ARR = z.array(CODES_10_SCHEMA).min(1);

/**
 * business_role
 */
const AS_REGEX = /OWNER|MANAGER|EMPLOYEE/;

export const BUSINESS_ROLE_SCHEMA = BASE_VALUE_SCHEMA.extend({
  as: z.string().regex(AS_REGEX),
});

export const BUSINESS_ROLE_ARR = z.array(BUSINESS_ROLE_SCHEMA).min(1);

/**
 * driverslicense_category
 */
const DLC_TYPE_REGEX = /AUTOMOTIVE|AVIATION|WATER|FIREARM/;

export const DLC_SCHEMA = BASE_VALUE_SCHEMA.extend({
  type: z.string().regex(DLC_TYPE_REGEX).max(255),
  description: z.string().nullish(),
});

export const DLC_ARR = z.array(DLC_SCHEMA).min(1);

/**
 * department
 */
const DEPARTMENT_TYPE_REGEX = /LEO|EMS_FD/;

export const DEPARTMENT_SCHEMA = BASE_VALUE_SCHEMA.extend({
  callsign: z.string().max(255).optional(),
  type: z.string().regex(DEPARTMENT_TYPE_REGEX).max(255),
  isDefaultDepartment: z.boolean().optional(),
  whitelisted: z.boolean().optional(),
  defaultOfficerRankId: z.string().nullish(),
  isConfidential: z.boolean().nullish(),
  extraFields: z.any().nullish(),
});

export const DEPARTMENT_ARR = z.array(DEPARTMENT_SCHEMA).min(1);

/**
 * division
 */
export const DIVISION_SCHEMA = BASE_VALUE_SCHEMA.extend({
  callsign: z.string().max(255).optional(),
  departmentId: z.string().min(2),
  pairedUnitTemplate: z.string().nullish(),
  extraFields: z.any().nullish(),
});

export const DIVISION_ARR = z.array(DIVISION_SCHEMA).min(1);

/**
 * penal code
 */

const PENAL_CODE_TYPE_REGEX = /FELONY|MISDEMEANOR|INFRACTION/;

const PENAL_CODE_GROUP = z.object({
  name: z.string(),
  id: z.string(),
  position: z.number().nullable(),
});

export const PENAL_CODE_SCHEMA = z.object({
  title: z.string().min(2).max(255),
  descriptionData: z.array(z.any()).nullish(),
  description: z.string().nullish(),
  groupId: z.string().nullish(),
  warningApplicable: z.boolean().optional(),
  warningNotApplicable: z.boolean().optional(),
  warningFines: z.any().nullish(),
  warningNotFines: z.any().nullish(),
  bail: z.any().nullish(),
  prisonTerm: z.any().nullish(),
  type: z.string().regex(PENAL_CODE_TYPE_REGEX).nullish(),
  isPrimary: z.boolean().nullish(),
  group: PENAL_CODE_GROUP.nullish(),
});

export const PENAL_CODE_ARR = z.array(PENAL_CODE_SCHEMA).min(1);

export const QUALIFICATION_SCHEMA = BASE_VALUE_SCHEMA.extend({
  departments: z.array(z.string()).min(1),
  image: z.any().nullish(),
  description: z.string().nullish(),
  qualificationType: z.string().min(2),
});

export const QUALIFICATION_ARR = z.array(QUALIFICATION_SCHEMA).min(1);

/**
 * call types
 */
export const CALL_TYPE_SCHEMA = BASE_VALUE_SCHEMA.extend({
  priority: z.string().nullish(),
});

export const CALL_TYPE_ARR = z.array(CALL_TYPE_SCHEMA).min(1);

/**
 * emergency vehicles
 */

export const EMERGENCY_VEHICLE_SCHEMA = BASE_VALUE_SCHEMA.extend({
  departments: z.array(z.string()).min(1),
  divisions: z.array(z.string()).nullish(),
});

export const EMERGENCY_VEHICLE_ARR = z.array(EMERGENCY_VEHICLE_SCHEMA).min(1);
