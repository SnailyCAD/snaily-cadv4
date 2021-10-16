import { z } from "zod";

export const CREATE_911_CALL = z.object({
  location: z.string().min(2),
  description: z.string().min(2),
  name: z.string().min(2).max(255),
});
