import { z } from "zod";

export const CREATE_COMPANY_SCHEMA = z.object({
  ownerId: z.string().min(2).max(255),
  name: z.string().min(2).max(255),
  address: z.string().min(2),
  whitelisted: z.boolean(),
});
