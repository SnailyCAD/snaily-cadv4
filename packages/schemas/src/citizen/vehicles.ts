import { z } from "zod";

export const VEHICLE_SCHEMA = z.object({
  model: z.string().min(2),
  color: z.string().min(2).max(255),
  registrationStatus: z.string().min(2).max(255),
  citizenId: z.string().min(2).max(255),
});
