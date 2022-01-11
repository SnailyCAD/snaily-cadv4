import { z } from "zod";

export const CREATE_BOLO_SCHEMA = z.object({
  description: z.string().min(2),
  name: z.string().max(255).nullable(),
  plate: z.string().max(255).nullable(),
  color: z.string().max(255).nullable(),
  model: z.string().max(255).nullable(),
  type: z
    .string()
    .min(2)
    .max(255)
    .regex(/PERSON|VEHICLE|OTHER/),
});
