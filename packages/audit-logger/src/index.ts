import type { User } from "@snailycad/types";
import type { AuditLogActions } from "./types/actions";

export type { AuditLogActions };
export type AuditLogMessages = any;

export interface AuditLog {
  id: string;
  action: AuditLogActions;
  executor: User;
  createdAt: Date;
  translationKey: AuditLogMessages | null;
}

export * from "./types/action-types";
export * from "./types/actions";
