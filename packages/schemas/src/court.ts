import { z } from "zod";

export const RELEASE_CITIZEN_SCHEMA = z.object({
  type: z.string().min(2),
  releasedBy: z.string(),
  recordId: z.string().min(2),
});

export const NAME_CHANGE_REQUEST_SCHEMA = z.object({
  citizenId: z.string().min(2),
  newName: z.string().min(1).max(255),
  newSurname: z.string().min(2).max(255),
});
