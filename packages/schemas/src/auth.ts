import { z } from "zod";

export const AUTH_SCHEMA = z.object({
  captchaResult: z.string().nullish(),
  username: z.string().min(3).max(255),
  password: z.string().min(8).max(255),
  registrationCode: z.string().optional(),
  totpCode: z.string().optional(),
});

export const REGISTER_SCHEMA = AUTH_SCHEMA.omit({ password: true }).extend({
  discordId: z.string().nullish(),
  steamId: z.string().nullish(),
  password: z.string().min(8).max(255).nullish(),
});

export const CHANGE_USER_SCHEMA = z.object({
  soundSettings: z.any(),
  isDarkTheme: z.boolean(),
  statusViewMode: z.string(),
  tableActionsAlignment: z.string(),
  locale: z.string().nullish(),
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
