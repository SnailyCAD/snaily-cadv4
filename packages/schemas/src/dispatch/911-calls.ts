import { z } from "zod";
import { SELECT_VALUE } from "../leo";

export const CALL_GTA_MAP_POSITION_SCHEMA = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  heading: z.number(),
});

export const ASSIGNED_UNIT = z.object({
  id: z.string().min(2),
  isPrimary: z.boolean().optional(),
});

export const CALL_911_SCHEMA = z.object({
  location: z.string().min(2),
  description: z.string().optional(),
  descriptionData: z.any().nullish(),
  name: z.string().min(2).max(255),
  postal: z.string().nullish(),
  assignedUnits: z.array(ASSIGNED_UNIT.or(SELECT_VALUE)).optional(),
  position: z.any().optional(),
  departments: z.array(z.string().or(SELECT_VALUE)).optional(),
  divisions: z.array(z.string().or(SELECT_VALUE)).optional(),
  situationCode: z.string().max(255).nullish(),
  type: z.string().nullish(),
  gtaMapPosition: CALL_GTA_MAP_POSITION_SCHEMA.nullish(),
  notifyAssignedUnits: z.boolean().optional(),
  extraFields: z.any().nullish(),
  status: z
    .string()
    .regex(/PENDING|ACCEPTED/)
    .nullish(),
});

export const LINK_INCIDENT_TO_CALL_SCHEMA = z.object({
  incidentIds: z.array(z.any()),
});

export const CALL_911_EVENT_SCHEMA = z.object({
  description: z.string().min(1),
  translationData: z.any().nullish(),
});

export const UPDATE_ASSIGNED_UNIT_SCHEMA = z.object({
  isPrimary: z.boolean(),
});
