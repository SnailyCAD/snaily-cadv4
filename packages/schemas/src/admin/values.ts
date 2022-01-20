import { z } from "zod";

export const VALUE_SCHEMA = z.object({
  value: z.string().min(1).max(255),
});

export const CREATE_PENAL_CODE_SCHEMA = z.object({
  title: z.string().min(2).max(255),
  description: z.string().optional().nullable(),
  descriptionData: z.any().optional().nullable(),
});

export const CREATE_PENAL_CODE_GROUP_SCHEMA = z.object({
  name: z.string().min(2).max(255),
});
