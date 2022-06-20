import type { User } from "@snailycad/types";
import type { AuditLogActions } from "./core/actions";

export interface AuditLog {
  id: string;
  action: AuditLogActions;
  executor: User;
  createdAt: Date;
}

export * from "./core/actionTypes";
export * from "./core/actions";
