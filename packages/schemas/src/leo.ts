import { z } from "zod";
import { VEHICLE_SCHEMA } from "./citizen";

export const SELECT_VALUE = z.object({
  value: z.any(),
  label: z.any(),
});

export const CREATE_OFFICER_SCHEMA = z.object({
  citizenId: z.string().min(2).max(255),
  department: z.string().min(2).max(255),
  callsign: z.string().min(1).max(255),
  callsign2: z.string().min(1).max(255),
  rank: z.string().max(255).nullable(),
  badgeNumber: z.number().min(1),
  division: z.string().min(2).max(255).optional(),
  divisions: z.array(z.string().min(2).max(255).or(SELECT_VALUE)).min(1),
  image: z.any().or(z.string()).optional(),
});

export const UPDATE_UNIT_SCHEMA = z.object({
  callsign: z.string().min(1).max(255),
  callsign2: z.string().min(1).max(255),
  department: z.string().min(2).max(255),
  division: z.string().min(2).max(255).nullable(),
  rank: z.string().max(255).nullable(),
  divisions: z.array(z.string().min(2).max(255).or(SELECT_VALUE)).nullable(),
  status: z.string().max(255).nullable(),
  suspended: z.boolean().nullable(),
  badgeNumber: z.number().min(1),
});

export const UPDATE_OFFICER_STATUS_SCHEMA = z.object({
  status: z.string().min(2).max(255),
  suspended: z.boolean().optional(),
});

export const SELECT_OFFICER_SCHEMA = z.object({
  officer: z.string().min(2).max(255),
});

export const LEO_INCIDENT_SCHEMA = z.object({
  description: z.string().nullable().optional(),
  descriptionData: z.any().nullable().optional(),
  firearmsInvolved: z.boolean(),
  injuriesOrFatalities: z.boolean(),
  arrestsMade: z.boolean(),
  involvedOfficers: z.array(z.any()).min(0).optional(),
  isActive: z.boolean().nullable().optional(),
  situationCodeId: z.string().max(255).nullable().optional(),
});

export const LEO_VEHICLE_LICENSE_SCHEMA = VEHICLE_SCHEMA.pick({
  inspectionStatus: true,
  insuranceStatus: true,
  registrationStatus: true,
  taxStatus: true,
});

export const DL_EXAM_SCHEMA = z.object({
  citizenId: z.string().min(2),
  practiceExam: z.string().nullable(),
  theoryExam: z.string().nullable(),
  categories: z.array(z.any()),
});
