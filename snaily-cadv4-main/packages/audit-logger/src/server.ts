import superjson from "superjson";
import type { AuditLogActions } from "./index";
import { captureException } from "@sentry/node";
import type { AuditLog as _AuditLog } from "@snailycad/types";

export * from "./types/action-types";
export * from "./types/actions";
type AuditLog = Omit<_AuditLog, "action"> & {
  action: any;
};

interface Options<Action extends AuditLogActions> {
  prisma: any;

  translationKey?: string | null;
  executorId: string;
  action: Action;
}

export async function createAuditLogEntry<Action extends AuditLogActions>(
  options: Options<Action>,
) {
  try {
    const auditLog = await options.prisma.auditLog.create({
      data: {
        translationKey: options.translationKey,
        action: superjson.serialize(options.action).json ?? null,
        executorId: options.executorId,
      },
    });

    return {
      ...auditLog,
      action: options.action,
    };
  } catch (error) {
    console.log(error);
    captureException(error);
    return null;
  }
}

export function parseAuditLogs<T extends AuditLog | AuditLog[]>(log: T) {
  function _parser(log: AuditLog) {
    if (typeof log.action === "string") {
      return { ...log, action: superjson.parse(log.action as string) };
    }

    return log;
  }

  if (Array.isArray(log)) {
    return log.map(_parser);
  }

  return _parser(log);
}
