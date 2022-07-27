import superjson from "superjson";
import type { AuditLog, AuditLogType, PrismaClient } from "@prisma/client";
import type { AuditLogActions } from "./actions";

export * from "./actionTypes";
export * from "./actions";

interface Options<Action extends AuditLogActions> {
  prisma: PrismaClient;

  type: AuditLogType;
  executorId: string;
  action: Action;
}

export async function createAuditLogEntry<Action extends AuditLogActions>(
  options: Options<Action>,
) {
  const auditLog = await options.prisma.auditLog.create({
    data: {
      type: options.type,
      action: superjson.stringify(options.action),
      executorId: options.executorId,
    },
  });

  return {
    ...auditLog,
    action: options.action,
  };
}

export function parseAuditLogs<T extends AuditLog | AuditLog[]>(log: T) {
  function _parser(log: AuditLog) {
    return { ...log, action: superjson.parse(log.action as string) };
  }

  if (Array.isArray(log)) {
    return log.map(_parser);
  }

  return _parser(log);
}
