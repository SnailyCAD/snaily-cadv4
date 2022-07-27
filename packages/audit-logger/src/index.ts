import type { User, AuditLogType } from "@snailycad/types";
import type { AuditLogActions } from "./core/actions";

export interface AuditLog {
  id: string;
  action: AuditLogActions;
  executor: User;
  createdAt: Date;
  type: AuditLogType;
}

export * from "./core/actionTypes";
export * from "./core/actions";
