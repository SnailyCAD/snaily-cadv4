import { z } from "zod";

export const VALUE_SCHEMA = z.object({
  value: z.string().min(2).max(255),
});
