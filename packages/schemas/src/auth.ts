import { z } from "zod";

export const AUTH_SCHEMA = z.object({
  username: z
    .string()
    .min(3)
    .max(255)
    .regex(/^([a-z_.\d]+)*[a-z\d]+$/i),
  password: z.string().min(8).max(255),
});
