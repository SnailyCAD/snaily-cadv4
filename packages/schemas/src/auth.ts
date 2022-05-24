import { z } from "zod";

export const AUTH_SCHEMA = z.object({
  username: z
    .string()
    .min(3)
    .max(255)
    .regex(/^([a-z_.\d]+)*[a-z\d]+$/i),
  password: z.string().min(8).max(255),
  registrationCode: z.string().optional(),
  totpCode: z.string().optional(),
});

export const CHANGE_USERNAME_SCHEMA = z.object({
  username: z
    .string()
    .min(3)
    .max(255)
    .regex(/^([a-z_.\d]+)*[a-z\d]+$/i),
});

export const CHANGE_PASSWORD_SCHEMA = z.object({
  // when using Discord Oauth, the password is set to an empty string; allow nullable to be sent.
  // gets double validated in the API.
  currentPassword: z.string().max(255).nullable(),
  newPassword: z.string().min(8).max(255),
  confirmPassword: z.string().min(8).max(255),
});

export const TEMP_PASSWORD_SCHEMA = z.object({
  newPassword: z.string().min(8).max(255),
  confirmPassword: z.string().min(8).max(255),
});
