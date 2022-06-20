import superjson from "superjson";
import type { PrismaClient } from "@prisma/client";
import type { AuditLogActions } from "./actions";

interface Options {
  prisma: PrismaClient;

  executorId: string;
  action: AuditLogActions;
}

export async function createAuditLogEntry(options: Options) {
  const auditLog = await options.prisma.auditLog.create({
    data: {
      action: superjson.stringify(options.action),
      executorId: options.executorId,
    },
  });

  return {
    ...auditLog,
    action: options.action,
  };
}
