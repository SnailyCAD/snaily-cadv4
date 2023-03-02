import { z } from "zod";
import { CREATE_TICKET_SCHEMA } from "./records";

export const CREATE_CITIZEN_SCHEMA = z.object({
  name: z.string().min(2).max(255),
  surname: z.string().min(3).max(255),
  gender: z.string().min(2).max(255),
  ethnicity: z.string().min(2).max(255),
  dateOfBirth: z
    .date()
    .min(new Date(1900, 0, 1))
    .max(new Date())
    .describe("ISO format")
    .or(z.string().min(2)),
  weight: z.string().min(2).max(255),
  height: z.string().min(2).max(255),
  hairColor: z.string().min(2).max(255),
  eyeColor: z.string().min(2).max(255),
  address: z.string().min(2).max(255),
  postal: z.string().max(255).nullish(),
  driversLicense: z.string().max(255).nullish(),
  weaponLicense: z.string().max(255).nullish(),
  pilotLicense: z.string().max(255).nullish(),
  waterLicense: z.string().max(255).nullish(),
  phoneNumber: z.string().max(255).nullish(),
  occupation: z.string().nullish(),
  additionalInfo: z.string().nullish(),
  driversLicenseCategory: z.array(z.any()).nullish(),
  pilotLicenseCategory: z.array(z.any()).nullish(),
  waterLicenseCategory: z.array(z.any()).nullish(),
  firearmLicenseCategory: z.array(z.any()).nullish(),
  image: z.any().nullish(),
  socialSecurityNumber: z.string().max(30).nullish(),
  appearance: z.string().nullish(),
  /** can only be used when updating a citizen via `PUT /admin/manage/citizens/:id` */
  userId: z.string().nullish(),
  records: z.array(CREATE_TICKET_SCHEMA).nullish(),
});

export const TAX_STATUS_REGEX = /TAXED|UNTAXED/;
export const INSPECTION_STATUS_REGEX = /PASSED|FAILED/;

export const VEHICLE_SCHEMA = z.object({
  plate: z.string().min(2).max(255),
  model: z.string().min(2).max(255),
  color: z.string().min(2).max(255),
  registrationStatus: z.string().min(2).max(255),
  insuranceStatus: z.string().max(255).nullable(),
  taxStatus: z.string().regex(TAX_STATUS_REGEX).nullish(),
  inspectionStatus: z.string().regex(INSPECTION_STATUS_REGEX).nullish(),
  citizenId: z.string().min(2).max(255),
  vinNumber: z.string().max(17).optional(),
  reportedStolen: z.boolean().optional(),
  businessId: z.string().max(255).nullish(),
  employeeId: z.string().max(255).nullish(),
  reApplyForDmv: z.boolean().nullish(),
  appearance: z.string().nullish(),
  trimLevels: z.array(z.any()).nullish(),
});

export const TRANSFER_VEHICLE_SCHEMA = z.object({
  ownerId: z.string().min(2).max(255),
});

export const DELETE_VEHICLE_SCHEMA = z.object({
  businessId: z.string().max(255).nullish(),
  employeeId: z.string().max(255).nullish(),
});

export const WEAPON_SCHEMA = z.object({
  model: z.string().min(2),
  registrationStatus: z.string().min(2).max(255),
  citizenId: z.string().min(2).max(255),
  serialNumber: z.string().max(255).optional(),
  reApplyForDmv: z.boolean().nullish(),
});

const END_TIME = z
  .date()
  .min(new Date())
  .describe("ISO format")
  .or(z.string().min(2))
  .nullable()
  .optional();

const SUSPENDED_SCHEMA = z.object({
  driverLicense: z.boolean(),
  driverLicenseTimeEnd: END_TIME,
  pilotLicense: z.boolean(),
  pilotLicenseTimeEnd: END_TIME,
  waterLicense: z.boolean(),
  waterLicenseTimeEnd: END_TIME,
  firearmsLicense: z.boolean(),
  firearmsLicenseTimeEnd: END_TIME,
});

export const LICENSE_SCHEMA = CREATE_CITIZEN_SCHEMA.pick({
  driversLicense: true,
  driversLicenseCategory: true,
  pilotLicense: true,
  pilotLicenseCategory: true,
  weaponLicense: true,
  firearmLicenseCategory: true,
  waterLicense: true,
  waterLicenseCategory: true,
}).extend({
  suspended: SUSPENDED_SCHEMA.nullish(),
});

export const MEDICAL_RECORD_SCHEMA = z.object({
  type: z.string().max(255),
  description: z.string(),
  bloodGroup: z.string().max(255).nullable(),
  citizenId: z.string().min(2).max(255),
});
