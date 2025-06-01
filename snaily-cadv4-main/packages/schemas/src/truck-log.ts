import { z } from "zod";

export const CREATE_TRUCK_LOG_SCHEMA = z.object({
  endedAt: z.string().min(1).max(255),
  startedAt: z.string().min(1).max(255),
  citizenId: z.string().min(2).max(255),
  vehicleId: z.string().min(2).max(255),
  notes: z.string().nullish(),
});
