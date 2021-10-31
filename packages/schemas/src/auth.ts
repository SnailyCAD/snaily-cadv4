import { z } from "zod";

export const AUTH_SCHEMA = z.object({
  username: z
    .string()
    .min(3)
    .max(255)
    .regex(/^([a-z_.\d]+)*[a-z\d]+$/i),
  password: z.string().min(8).max(255),
});

export const CHANGE_PASSWORD_SCHEMA = z.object({
  currentPassword: z.string().min(8).max(255),
  newPassword: z.string().min(8).max(255),
  confirmPassword: z.string().min(8).max(255),
});

export const TEMP_PASSWORD_SCHEMA = z.object({
  newPassword: z.string().min(8).max(255),
  confirmPassword: z.string().min(8).max(255),
});
