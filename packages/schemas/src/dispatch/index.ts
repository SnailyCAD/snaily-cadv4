import { z } from "zod";

export * from "./911-calls";
export * from "./bolos";

export const UPDATE_AOP_SCHEMA = z.object({
  aop: z.string().min(1).max(255),
});

export const UPDATE_RADIO_CHANNEL_SCHEMA = z.object({
  radioChannel: z.string().nullable(),
});

export const TONES_SCHEMA = z.object({
  leoTone: z.boolean(),
  emsFdTone: z.boolean(),
  description: z.string().max(355).nullish(),
});
