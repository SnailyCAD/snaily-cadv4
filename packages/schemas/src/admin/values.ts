import { z } from "zod";

export const CREATE_PENAL_CODE_GROUP_SCHEMA = z.object({
  name: z.string().min(2).max(255),
});
