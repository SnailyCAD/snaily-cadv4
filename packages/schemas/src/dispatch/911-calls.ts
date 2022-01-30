import { z } from "zod";
import { SELECT_VALUE } from "../leo";

export const CREATE_911_CALL = z.object({
  location: z.string().min(2),
  description: z.string().optional(),
  descriptionData: z.any().nullable().optional(),
  name: z.string().min(2).max(255),
  postal: z.string().optional(),
  assignedUnits: z.array(z.string().or(SELECT_VALUE)),
  position: z.any().optional(),
  departments: z.array(z.string().or(SELECT_VALUE)).optional(),
  divisions: z.array(z.string().or(SELECT_VALUE)).optional(),
});

export const LINK_INCIDENT_TO_CALL = z.object({
  incidentId: z.string().min(2).max(255),
});

export const CREATE_911_CALL_EVENT = z.object({
  description: z.string().min(1),
});
