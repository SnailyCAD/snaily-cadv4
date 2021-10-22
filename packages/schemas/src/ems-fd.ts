import { z } from "zod";

export const SELECT_DEPUTY_SCHEMA = z.object({
  deputy: z.string().min(2).max(255),
});
