import { z } from "zod";
import { INSPECTION_STATUS_REGEX, TAX_STATUS_REGEX } from "../../citizen";

export const VEHICLE_SCHEMA = z.object({
  plate: z.string().min(2).max(255),
  modelId: z.string().min(2).max(255),
  ownerId: z.string().min(2).max(255),
  registrationStatusId: z.string().min(2).max(255),
  insuranceStatus: z.string().max(255).nullish(),
  color: z.string().min(2).max(255),
  reportedStolen: z.boolean().nullish(),
  taxStatus: z.string().regex(TAX_STATUS_REGEX).nullish(),
  inspectionStatus: z.string().regex(INSPECTION_STATUS_REGEX).nullish(),
  flags: z.array(z.string()).nullish(),
});

export const VEHICLE_SCHEMA_ARR = z.array(VEHICLE_SCHEMA).min(1);
