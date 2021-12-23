import { PrismaClient } from "@prisma/client";

const isDevelopment = process.env.NODE_ENV === "development";

const log = (isDevelopment ? ["info", "warn", "error"] : ["info", "error"]) as any[];

export const prisma = new PrismaClient({ errorFormat: "pretty", log });
