import { z } from "zod";
import { SELECT_VALUE } from "../leo";

export const CALL_911_SCHEMA = z.object({
  location: z.string().min(2),
  description: z.string().optional(),
  descriptionData: z.any().nullable().optional(),
  name: z.string().min(2).max(255),
  postal: z.string().nullable().optional(),
  assignedUnits: z.array(z.string().or(SELECT_VALUE)).optional(),
  position: z.any().optional(),
  departments: z.array(z.string().or(SELECT_VALUE)).optional(),
  divisions: z.array(z.string().or(SELECT_VALUE)).optional(),
  situationCode: z.string().max(255).nullable().optional(),
  type: z.string().nullable().optional(),
});

export const LINK_INCIDENT_TO_CALL_SCHEMA = z.object({
  incidentIds: z.array(z.any()),
});

export const CALL_911_EVENT_SCHEMA = z.object({
  description: z.string().min(1),
});
