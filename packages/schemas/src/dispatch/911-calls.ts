import { z } from "zod";

export const CREATE_911_CALL = z.object({
  location: z.string().min(2),
  description: z.string().min(2),
  name: z.string().min(2).max(255),
});

export const LINK_INCIDENT_TO_CALL = z.object({
  incidentId: z.string().min(2).max(255),
});
