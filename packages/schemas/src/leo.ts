import { z } from "zod";
import { CREATE_CITIZEN_SCHEMA, VEHICLE_SCHEMA } from "./citizen";

export const SELECT_VALUE = z.object({
  value: z.any(),
  label: z.any(),
});

export const INDIVIDUAL_CALLSIGN_SCHEMA = z.object({
  callsign: z.string().max(255),
  callsign2: z.string().max(255),
  divisionId: z.string().min(2).max(255).optional(),
});

export const CREATE_OFFICER_SCHEMA = z.object({
  citizenId: z.string().min(2).max(255),
  department: z.string().min(2).max(255),
  callsign: z.string().min(1).max(255),
  callsign2: z.string().min(1).max(255),
  rank: z.string().max(255).nullable(),
  badgeNumber: z.number().min(1).optional(),
  divisions: z.array(z.string().min(2).max(255).or(SELECT_VALUE)).optional(),
  image: z.any().or(z.string()).optional(),
  callsigns: z.record(INDIVIDUAL_CALLSIGN_SCHEMA).nullish(),
});

export const CREATE_TEMPORARY_OFFICER_SCHEMA = CREATE_OFFICER_SCHEMA.omit({
  citizenId: true,
  image: true,
  rank: true,
}).extend({
  name: z.string().min(2).max(255),
  surname: z.string().min(2).max(255),
  identifiers: z.array(z.string()).nullish(),
});

export const CREATE_CITIZEN_WITH_OFFICER_SCHEMA = CREATE_OFFICER_SCHEMA.omit({
  citizenId: true,
  image: true,
}).and(CREATE_CITIZEN_SCHEMA);

export const UPDATE_UNIT_SCHEMA = z.object({
  callsign: z.string().min(1).max(255),
  callsign2: z.string().min(1).max(255),
  department: z.string().min(2).max(255),
  division: z.string().min(2).max(255).nullish(),
  rank: z.string().max(255).nullable(),
  position: z.string().nullish(),
  divisions: z.array(z.string().min(2).max(255).or(SELECT_VALUE)).nullish(),
  status: z.string().max(255).nullable(),
  suspended: z.boolean().nullable(),
  badgeNumber: z.number().min(1).optional(),
  callsigns: z.record(INDIVIDUAL_CALLSIGN_SCHEMA).nullish(),
  image: z.any().or(z.string()).optional(),
  userId: z.string().nullish(),
});

export const UPDATE_UNIT_CALLSIGN_SCHEMA = z.object({
  callsign: z.string().min(1).max(255),
  callsign2: z.string().min(1).max(255),
  callsigns: z.record(INDIVIDUAL_CALLSIGN_SCHEMA).nullish(),
});

export const UPDATE_OFFICER_STATUS_SCHEMA = z.object({
  status: z.string().min(2).max(255),
  suspended: z.boolean().optional(),
  vehicleId: z.string().nullish(),
});

export const SELECT_OFFICER_SCHEMA = z.object({
  officer: z.object({ id: z.string().min(2).max(255) }),
});

export const LEO_INCIDENT_SCHEMA = z.object({
  description: z.string().nullish(),
  descriptionData: z.any().nullish(),
  postal: z.string().nullish(),
  firearmsInvolved: z.boolean(),
  injuriesOrFatalities: z.boolean(),
  arrestsMade: z.boolean(),
  unitsInvolved: z.array(z.string().or(SELECT_VALUE)).min(0).optional(),
  isActive: z.boolean().nullish(),
  situationCodeId: z.string().max(255).nullish(),
});

export const LEO_VEHICLE_LICENSE_SCHEMA = VEHICLE_SCHEMA.pick({
  inspectionStatus: true,
  insuranceStatus: true,
  registrationStatus: true,
  taxStatus: true,
});

export const LEO_VEHICLE_SCHEMA = VEHICLE_SCHEMA.omit({ citizenId: true }).extend({
  citizenId: z.string().nullish(),
});

const EXAM_TYPE_REGEX = /DRIVER|FIREARM|WATER|PILOT/;
export const LICENSE_EXAM_SCHEMA = z.object({
  type: z.string().regex(EXAM_TYPE_REGEX),
  citizenId: z.string().min(2),
  practiceExam: z.string().nullable(),
  theoryExam: z.string().nullable(),
  categories: z.array(z.any()).nullish(),
  license: z.string(),
});

export const LEO_CUSTOM_FIELDS_SCHEMA = z.record(
  z.object({
    fieldId: z.string().min(2),
    valueId: z.string().nullish(),
    value: z.string().nullish(),
  }),
);

export const CUSTOM_FIELD_SEARCH_SCHEMA = z.object({
  customFieldId: z.string().min(1),
  query: z.string().min(1),
});

export const NOTE_SCHEMA = z.object({
  type: z.string().regex(/VEHICLE|CITIZEN/),
  text: z.string().min(1),
  itemId: z.string().min(2),
});

export const SWITCH_CALLSIGN_SCHEMA = z.object({
  callsign: z.string().min(2).nullish(),
});

export const IMPOUND_VEHICLE_SCHEMA = z.object({
  impoundLot: z.string().min(2),
});
