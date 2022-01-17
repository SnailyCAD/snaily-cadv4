import { z } from "zod";

export const RELEASE_CITIZEN_SCHEMA = z.object({
  type: z.string().min(2),
  releasedBy: z.string().min(2),
  recordId: z.string().min(2),
});
