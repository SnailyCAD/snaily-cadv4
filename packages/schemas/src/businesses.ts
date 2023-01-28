import { z } from "zod";

export const CREATE_COMPANY_SCHEMA = z.object({
  ownerId: z.string().min(2).max(255),
  employeeId: z.string().min(2).max(255).nullish(),
  name: z.string().min(2).max(255),
  address: z.string().min(2),
  postal: z.string().max(255).nullish(),
  whitelisted: z.boolean(),
});

export const JOIN_COMPANY_SCHEMA = z.object({
  businessId: z.string().min(2).max(255),
  citizenId: z.string().min(2).max(255),
});

export const CREATE_COMPANY_POST_SCHEMA = z.object({
  employeeId: z.string().min(2).max(255),
  title: z.string().min(2).max(255),
  body: z.string().nullish(),
  bodyData: z.any().nullish(),
});

export const DELETE_COMPANY_POST_SCHEMA = z.object({
  employeeId: z.string().min(2).max(255),
});

export const UPDATE_EMPLOYEE_SCHEMA = z.object({
  employeeId: z.string().min(2).max(255),
  employeeOfTheMonth: z.boolean(),
  canCreatePosts: z.boolean(),
  roleId: z.string().min(2).max(255),
});

export const FIRE_EMPLOYEE_SCHEMA = z.object({
  employeeId: z.string().min(2).max(255),
});

export const BUSINESSES_BUSINESS_ROLE_SCHEMA = z.object({
  value: z.string().min(1).max(255),
  as: z.string().regex(/MANAGER|EMPLOYEE/),
});
