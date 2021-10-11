import { z } from "zod";

export const TOW_SCHEMA = z.object({
  location: z.string().min(2).max(255),
  description: z.string().min(3),
  creatorId: z.string().min(2).max(255),
});
