import type { User } from "@snailycad/types";
import type { AuditLogActions } from "./core/actions";

export type AuditLogMessages =
  keyof typeof import("../../client/locales/en/admin.json")["AuditLogs"];

export interface AuditLog {
  id: string;
  action: AuditLogActions;
  executor: User;
  createdAt: Date;
  translationKey: AuditLogMessages | null;
}

export * from "./core/actionTypes";
export * from "./core/actions";
