import { z } from "zod";

export const CREATE_CITIZEN_SCHEMA = (isServer = false) =>
  z.object({
    name: z.string().min(3).max(255),
    surname: z.string().min(3).max(255),
    gender: z.string().min(2).max(255),
    ethnicity: z.string().min(2).max(255),
    dateOfBirth: isServer ? z.string() : z.date(),
    weight: z.string().min(2).max(255),
    height: z.string().min(2).max(255),
    hairColor: z.string().min(2).max(255),
    eyeColor: z.string().min(2).max(255),
    address: z.string().min(2).max(255),
  });

export const VEHICLE_SCHEMA = z.object({
  model: z.string().min(2),
  color: z.string().min(2).max(255),
  registrationStatus: z.string().min(2).max(255),
  citizenId: z.string().min(2).max(255),
});

export const WEAPON_SCHEMA = z.object({
  model: z.string().min(2),
  registrationStatus: z.string().min(2).max(255),
  citizenId: z.string().min(2).max(255),
});
