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
  | BusinessUpdate
  | BusinessDelete
  | CustomFieldCreate
  | CustomFieldDelete
  | CustomFieldUpdate
  | CustomRoleCreate
  | CustomRoleDelete
  | CustomRoleUpdate;

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
  AuditLogActionType.UserDelete,
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
  string[]
>;

export type BusinessDelete = BaseAuditLogAction<
  AuditLogActionType.BusinessDelete,
  undefined,
  Types.Business
>;
export type BusinessUpdate = BaseAuditLogAction<
  AuditLogActionType.BusinessUpdate,
  Types.Business,
  Types.Business
>;

export type CustomFieldCreate = BaseAuditLogAction<
  AuditLogActionType.CustomFieldCreate,
  undefined,
  Types.CustomField
>;
export type CustomFieldUpdate = BaseAuditLogAction<
  AuditLogActionType.CustomFieldUpdate,
  Types.CustomField,
  Types.CustomField
>;
export type CustomFieldDelete = BaseAuditLogAction<
  AuditLogActionType.CustomFieldDelete,
  undefined,
  Types.CustomField
>;

export type CustomRoleCreate = BaseAuditLogAction<
  AuditLogActionType.CustomRoleCreate,
  undefined,
  Types.CustomRole
>;
export type CustomRoleUpdate = BaseAuditLogAction<
  AuditLogActionType.CustomRoleUpdate,
  Types.CustomRole,
  Types.CustomRole
>;
export type CustomRoleDelete = BaseAuditLogAction<
  AuditLogActionType.CustomRoleDelete,
  undefined,
  Types.CustomRole
>;
