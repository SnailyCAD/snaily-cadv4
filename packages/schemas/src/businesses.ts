import { z } from "zod";

export const CREATE_COMPANY_SCHEMA = z.object({
  ownerId: z.string().min(2).max(255),
  name: z.string().min(2).max(255),
  address: z.string().min(2),
  whitelisted: z.boolean(),
});

export const JOIN_COMPANY_SCHEMA = z.object({
  businessId: z.string().min(2).max(255),
  citizenId: z.string().min(2).max(255),
});

export const CREATE_COMPANY_POST_SCHEMA = z.object({
  employeeId: z.string().min(2).max(255),
  title: z.string().min(2).max(255),
  body: z.string().min(2),
});

export const DELETE_COMPANY_POST_SCHEMA = z.object({
  employeeId: z.string().min(2).max(255),
});
