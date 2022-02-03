import { z } from "zod";

export const VEHICLE_SCHEMA = z.object({
  plate: z.string().min(2).max(255),
  modelId: z.string().min(2).max(255),
  ownerId: z.string().min(2).max(255),
  registrationStatusId: z.string().min(2).max(255),
  color: z.string().min(2).max(255),
});

export const VEHICLE_SCHEMA_ARR = z.array(VEHICLE_SCHEMA).min(1);
