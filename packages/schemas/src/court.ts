import { z } from "zod";

export const RELEASE_CITIZEN_SCHEMA = z.object({
  type: z.string().min(2),
  releasedById: z.string(),
  recordId: z.string().min(2),
});

export const NAME_CHANGE_REQUEST_SCHEMA = z.object({
  citizenId: z.string().min(2),
  newName: z.string().min(1).max(255),
  newSurname: z.string().min(2).max(255),
  description: z.string().nullish(),
});

export const EXPUNGEMENT_REQUEST_SCHEMA = z.object({
  description: z.string().nullish(),
  warrants: z.array(z.any()),
  arrestReports: z.array(z.any()),
  tickets: z.array(z.any()),
});

export const COURT_DATE_SCHEMA = z.object({
  note: z.string().nullish(),
  date: z.any(),
});

export const COURT_ENTRY_SCHEMA = z.object({
  title: z.string().min(2),
  caseNumber: z.string(),
  descriptionData: z.any().nullish(),
  dates: z.array(COURT_DATE_SCHEMA),
});

export const COURTHOUSE_POST_SCHEMA = z.object({
  title: z.string().min(2),
  descriptionData: z.any().nullish(),
});
