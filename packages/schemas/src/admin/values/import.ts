import { z } from "zod";

const LICENSE_TYPE_REGEX = /LICENSE|INSURANCE_STATUS|REGISTRATION_STATUS/;
export const BASE_VALUE_SCHEMA = z.object({
  value: z.string().min(1).max(255),
  licenseType: z.string().regex(LICENSE_TYPE_REGEX).nullable().optional(),
  isDefault: z.boolean().nullable().optional(),
  officerRankImageId: z.any().nullable().optional(),
  officerRankDepartments: z.array(z.any()).nullable().optional(),
  isDisabled: z.boolean().nullable().optional(),
});
export const BASE_ARR = z.array(BASE_VALUE_SCHEMA).min(1);

export const HASH_SCHEMA = BASE_VALUE_SCHEMA.extend({
  hash: z.string().max(255).optional(),
});

export const HASH_SCHEMA_ARR = z.array(HASH_SCHEMA).min(1);

/**
 * codes_10
 */
const SHOULD_DO_REGEX = /SET_OFF_DUTY|SET_ON_DUTY|SET_ASSIGNED|SET_STATUS|PANIC_BUTTON/;
const TYPE_REGEX = /STATUS_CODE|SITUATION_CODE/;

export const CODES_10_SCHEMA = BASE_VALUE_SCHEMA.extend({
  shouldDo: z.string().regex(SHOULD_DO_REGEX),
  color: z.string().max(255).nullable().optional(),
  type: z.string().regex(TYPE_REGEX).max(255),
  whatPages: z.array(z.any()).max(3).nullable().optional(),
  departments: z.array(z.any()).nullable().optional(),
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
  description: z.string().nullable().optional(),
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
  defaultOfficerRankId: z.string().nullable().optional(),
  isConfidential: z.boolean().nullable().optional(),
});

export const DEPARTMENT_ARR = z.array(DEPARTMENT_SCHEMA).min(1);

/**
 * division
 */
export const DIVISION_SCHEMA = BASE_VALUE_SCHEMA.extend({
  callsign: z.string().max(255).optional(),
  departmentId: z.string().min(2),
  pairedUnitTemplate: z.string().nullable().optional(),
});

export const DIVISION_ARR = z.array(DIVISION_SCHEMA).min(1);

/**
 * penal code
 */

const PENAL_CODE_TYPE_REGEX = /FELONY|MISDEMEANOR|INFRACTION/;

export const PENAL_CODE_SCHEMA = z.object({
  title: z.string().min(2).max(255),
  descriptionData: z.array(z.any()).optional().nullable(),
  description: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  warningApplicable: z.boolean().optional(),
  warningNotApplicable: z.boolean().optional(),
  warningFines: z.any().nullable().optional(),
  warningNotFines: z.any().nullable().optional(),
  bail: z.any().nullable().optional(),
  prisonTerm: z.any().nullable().optional(),
  type: z.string().regex(PENAL_CODE_TYPE_REGEX).optional().nullable(),
});

export const PENAL_CODE_ARR = z.array(PENAL_CODE_SCHEMA).min(1);

export const QUALIFICATION_SCHEMA = BASE_VALUE_SCHEMA.extend({
  departments: z.array(z.string()).min(1),
  image: z.any().nullable().optional(),
  description: z.string().nullable().optional(),
  qualificationType: z.string().min(2),
});

export const QUALIFICATION_ARR = z.array(QUALIFICATION_SCHEMA).min(1);

/**
 * call types
 */
export const CALL_TYPE_SCHEMA = BASE_VALUE_SCHEMA.extend({
  priority: z.string().optional().nullable(),
});

export const CALL_TYPE_ARR = z.array(CALL_TYPE_SCHEMA).min(1);
