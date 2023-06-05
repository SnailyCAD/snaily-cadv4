import { z } from "zod";

export const BLEETER_SCHEMA = z.object({
  title: z.string().min(2).max(255),
  body: z.string().nullish(),
  bodyData: z.any().nullish(),
});

export const BLEETER_PROFILE_SCHEMA = z.object({
  handle: z.string().min(2).max(255).toLowerCase(),
  name: z.string().min(2).max(255),
  bio: z.string().nullish(),
});
