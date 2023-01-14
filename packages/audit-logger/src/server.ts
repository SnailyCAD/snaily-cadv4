import superjson from "superjson";
import type { AuditLog, PrismaClient } from "@prisma/client";
import type { AuditLogActions } from "./index";

export * from "./types/action-types";
export * from "./types/actions";

export type AuditLogMessages =
  keyof typeof import("../../../apps/client/locales/en/admin.json")["AuditLogs"];

interface Options<Action extends AuditLogActions> {
  prisma: PrismaClient;

  translationKey?: AuditLogMessages | null;
  executorId: string;
  action: Action;
}

export async function createAuditLogEntry<Action extends AuditLogActions>(
  options: Options<Action>,
) {
  const auditLog = await options.prisma.auditLog.create({
    data: {
      translationKey: options.translationKey,
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
