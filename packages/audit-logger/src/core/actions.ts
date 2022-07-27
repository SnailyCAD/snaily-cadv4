import type * as Types from "@snailycad/types";
import type { AuditLogActionType } from "./actionTypes";
import type { Citizen, User, Officer, EmsFdDeputy } from "@prisma/client";

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

export interface BaseAuditLogAction<ActionType extends AuditLogActionType, Previous, New> {
  type: ActionType;
  previous: Previous;
  new: New;
}

export type UserBanAction = BaseAuditLogAction<
  AuditLogActionType.UserBan,
  undefined,
  User | Types.User
>;
export type UserUnBanAction = BaseAuditLogAction<
  AuditLogActionType.UserUnban,
  undefined,
  User | Types.User
>;
export type UserUpdate = BaseAuditLogAction<
  AuditLogActionType.UserUpdate,
  User | Types.User,
  User | Types.User
>;
export type UserDelete = BaseAuditLogAction<
  AuditLogActionType.UserUpdate,
  undefined,
  User | Types.User
>;
export type UserTempPassword = BaseAuditLogAction<
  AuditLogActionType.UserTempPassword,
  undefined,
  User | Types.User
>;
export type CitizenUpdate = BaseAuditLogAction<
  AuditLogActionType.CitizenUpdate,
  Citizen | Types.Citizen,
  Citizen | Types.Citizen
>;
export type CitizenDelete = BaseAuditLogAction<
  AuditLogActionType.CitizenDelete,
  undefined,
  Citizen | Types.Citizen
>;
export type UnitUpdate = BaseAuditLogAction<
  AuditLogActionType.UnitUpdate,
  Types.Officer | Types.EmsFdDeputy | Officer | EmsFdDeputy,
  Types.Officer | Types.EmsFdDeputy | Officer | EmsFdDeputy
>;
export type UnitDelete = BaseAuditLogAction<
  AuditLogActionType.UnitDelete,
  undefined,
  Types.Officer | Types.EmsFdDeputy | Officer | EmsFdDeputy
>;
export type UnitsSetOffDuty = BaseAuditLogAction<
  AuditLogActionType.UnitsSetOffDuty,
  undefined,
  undefined
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
