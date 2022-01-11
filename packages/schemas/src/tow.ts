import { z } from "zod";

export const TOW_SCHEMA = z.object({
  location: z.string().min(2).max(255),
  description: z.string().min(3),
  creatorId: z.string().min(2).max(255).nullable(),
  postal: z.string().max(255).optional(),
  plate: z.string().max(255).optional(),
  call911Id: z.string().max(255).optional(),
  deliveryAddress: z.string().max(255).optional(),
  callCountyService: z.boolean().optional(),
});

export const UPDATE_TOW_SCHEMA = z.object({
  location: z.string().min(2).max(255),
  description: z.string().min(3),
  assignedUnitId: z.string().max(255).nullable(),
  postal: z.string().max(255).optional(),
});
