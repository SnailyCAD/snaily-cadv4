import { z } from "zod";
import { CREATE_OFFICER_SCHEMA } from "./leo";

export const SELECT_DEPUTY_SCHEMA = z.object({
  deputy: z.string().min(2).max(255),
  vehicleId: z.string().nullish(),
});

export const EMS_FD_DEPUTY_SCHEMA = CREATE_OFFICER_SCHEMA.omit({
  divisions: true,
}).extend({
  division: z.string().max(255).optional(),
});
