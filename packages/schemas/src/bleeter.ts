import { z } from "zod";

export const BLEETER_SCHEMA = z.object({
  title: z.string().min(2).max(255),
  body: z.string().nullable().optional(),
  bodyData: z.any().nullable().optional(),
});
