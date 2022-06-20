import type { PrismaClient } from "@prisma/client";
import type { AuditLogActions } from "./actions";

interface Options {
  prisma: PrismaClient;
  action: AuditLogActions;
}

export async function createAuditLogEntry(options: Options) {}
