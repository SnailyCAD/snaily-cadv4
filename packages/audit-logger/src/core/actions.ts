import type * as Types from "@snailycad/types";
import type { AuditLogActionType } from "./actionTypes";
import type { Officer, EmsFdDeputy } from "@prisma/client";

export type AuditLogActions =
  | UserBanAction
  | UserUnBanAction
  | UserUpdate
  | UserDelete
  | UserTempPassword
  | CitizenUpdate
  | CitizenDelete
  | UnitUpdate
  | UnitDelete
  | UnitsSetOffDuty
  | UnitQualificationAdd
  | UnitQualificationDelete;

export interface BaseAuditLogAction<Type extends AuditLogActionType, Previous, New> {
  type: Type;
  previous: Previous;
  new: New;
}

export type UserBanAction = BaseAuditLogAction<AuditLogActionType.UserBan, unknown, Types.User>;
export type UserUnBanAction = BaseAuditLogAction<AuditLogActionType.UserUnban, unknown, Types.User>;
export type UserUpdate = BaseAuditLogAction<AuditLogActionType.UserUpdate, Types.User, Types.User>;
export type UserDelete = BaseAuditLogAction<AuditLogActionType.UserUpdate, unknown, Types.User>;
export type UserTempPassword = BaseAuditLogAction<
  AuditLogActionType.UserTempPassword,
  unknown,
  Types.User
>;
export type CitizenUpdate = BaseAuditLogAction<
  AuditLogActionType.CitizenUpdate,
  Types.Citizen,
  Types.Citizen
>;
export type CitizenDelete = BaseAuditLogAction<
  AuditLogActionType.CitizenDelete,
  Types.Citizen,
  Types.Citizen
>;
export type UnitUpdate = BaseAuditLogAction<
  AuditLogActionType.UnitUpdate,
  Types.Officer | Types.EmsFdDeputy | Officer | EmsFdDeputy,
  Types.Officer | Types.EmsFdDeputy | Officer | EmsFdDeputy
>;
export type UnitDelete = BaseAuditLogAction<
  AuditLogActionType.UnitDelete,
  Types.Officer | Types.EmsFdDeputy,
  Types.Officer | Types.EmsFdDeputy
>;
export type UnitsSetOffDuty = BaseAuditLogAction<
  AuditLogActionType.UnitsSetOffDuty,
  unknown,
  unknown
>;
export type UnitQualificationAdd = BaseAuditLogAction<
  AuditLogActionType.UnitQualificationAdd,
  Types.Officer | Types.EmsFdDeputy,
  Types.Officer | Types.EmsFdDeputy
>;
export type UnitQualificationDelete = BaseAuditLogAction<
  AuditLogActionType.UnitQualificationDelete,
  Types.Officer | Types.EmsFdDeputy,
  Types.Officer | Types.EmsFdDeputy
>;
