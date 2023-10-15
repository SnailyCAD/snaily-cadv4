import type * as Types from "@snailycad/types";
import type { AuditLogActionType } from "./action-types";

export type AuditLogActions =
  | UserBanAction
  | UserUnBanAction
  | UserUpdate
  | UserDelete
  | UserPermissionsUpdateAction
  | UserRolesUpdateAction
  | UsersPrunedAction
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
  | CustomRoleUpdate
  | CadSettingsUpdate
  | MiscCadSettingsUpdate
  | UserApiTokenDelete
  | User2FADelete
  | Calls911Purge
  | CadAPITokenRegenerated
  | CADFeaturesUpdate
  | TemporaryUnitCreate
  | TemporaryUnitUpdate
  | UnitsPruned
  | UserWhitelistStatusChange
  | BusinessEmployeeUpdate
  | BusinessEmployeeFire
  | UpdateDiscordRoles
  | UpdateDiscordWebhooks
  | UpdateRawWebhooks
  | CadAPITokenRemoved
  | CadAPITokenEnabled
  | CadAutoSetPropertiesUpdate
  | ExpungementRequestAccepted
  | ExpungementRequestDeclined
  | NameChangeRequestAccepted
  | NameChangeRequestDeclined
  | ActiveWarrantAccepted
  | ActiveWarrantDeclined
  | UnitQualificationSuspended
  | UnitQualificationAdd
  | UnitQualificationRemove
  | UnitDepartmentDeclined
  | UnitDepartmentAccepted
  | ValueAdd
  | ValueUpdate
  | ValueRemove
  | ValueBulkRemove
  | LeoIncidentsPurged
  | EmsIncidentsPurged
  | Signal100Toggled
  | Call911Create
  | CitizenRecordRemove
  | CitizenWarrantRemove;

type BaseAuditLogAction<ActionType extends AuditLogActionType, Previous, New> = {
  type: ActionType;
} & (Previous extends undefined ? {} : { previous: Partial<Previous> }) &
  (New extends undefined ? {} : { new: Partial<New> });

export type UsersPrunedAction = BaseAuditLogAction<
  AuditLogActionType.UsersPruned,
  undefined,
  undefined
>;
export type UserPermissionsUpdateAction = BaseAuditLogAction<
  AuditLogActionType.UserPermissionsUpdate,
  Types.User,
  Types.User
>;
export type UserRolesUpdateAction = BaseAuditLogAction<
  AuditLogActionType.UserRolesUpdate,
  Types.User,
  Types.User
>;
export type UserBanAction = BaseAuditLogAction<AuditLogActionType.UserBan, undefined, Types.User>;
export type UserUnBanAction = BaseAuditLogAction<
  AuditLogActionType.UserUnban,
  undefined,
  Types.User
>;
export type UserUpdate = BaseAuditLogAction<AuditLogActionType.UserUpdate, Types.User, Types.User>;
export type UserDelete = BaseAuditLogAction<AuditLogActionType.UserDelete, undefined, Types.User>;
export type UserTempPassword = BaseAuditLogAction<
  AuditLogActionType.UserTempPassword,
  undefined,
  Types.User
>;
export type UserApiTokenDelete = BaseAuditLogAction<
  AuditLogActionType.UserApiTokenDelete,
  undefined,
  Types.User
>;
export type User2FADelete = BaseAuditLogAction<
  AuditLogActionType.User2FADelete,
  undefined,
  Types.User
>;
export type CitizenUpdate = BaseAuditLogAction<
  AuditLogActionType.CitizenUpdate,
  Types.Citizen,
  Types.Citizen
>;
export type CitizenDelete = BaseAuditLogAction<
  AuditLogActionType.CitizenDelete,
  undefined,
  Types.Citizen
>;
export type UnitUpdate = BaseAuditLogAction<
  AuditLogActionType.UnitUpdate,
  Types.Officer | Types.EmsFdDeputy,
  Types.Officer | Types.EmsFdDeputy
>;
export type UnitDelete = BaseAuditLogAction<
  AuditLogActionType.UnitDelete,
  undefined,
  Types.Officer | Types.EmsFdDeputy
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
export type BusinessEmployeeUpdate = BaseAuditLogAction<
  AuditLogActionType.BusinessEmployeeUpdate,
  Types.Employee,
  Types.Employee
>;
export type BusinessEmployeeFire = BaseAuditLogAction<
  AuditLogActionType.BusinessEmployeeFire,
  undefined,
  Partial<Types.Employee>
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
export type CadSettingsUpdate = BaseAuditLogAction<
  AuditLogActionType.CadSettingsUpdate,
  Types.cad,
  Types.cad
>;
export type MiscCadSettingsUpdate = BaseAuditLogAction<
  AuditLogActionType.MiscCadSettingsUpdate,
  Types.MiscCadSettings,
  Types.MiscCadSettings
>;
export type Calls911Purge = BaseAuditLogAction<
  AuditLogActionType.Calls911Purge,
  undefined,
  string[]
>;
export type CadAPITokenRegenerated = BaseAuditLogAction<
  AuditLogActionType.CadAPITokenRegenerated,
  undefined,
  undefined
>;
export type CADFeaturesUpdate = BaseAuditLogAction<
  AuditLogActionType.CADFeaturesUpdate,
  Record<Types.Feature, boolean>,
  Record<Types.Feature, boolean>
>;
export type TemporaryUnitCreate = BaseAuditLogAction<
  AuditLogActionType.TemporaryUnitCreate,
  undefined,
  Types.Officer | Types.EmsFdDeputy
>;
export type TemporaryUnitUpdate = BaseAuditLogAction<
  AuditLogActionType.TemporaryUnitUpdate,
  Types.Officer | Types.EmsFdDeputy,
  Types.Officer | Types.EmsFdDeputy
>;
export type UnitsPruned = BaseAuditLogAction<AuditLogActionType.UnitsPruned, undefined, undefined>;
export type UserWhitelistStatusChange = BaseAuditLogAction<
  AuditLogActionType.UserWhitelistStatusChange,
  Partial<Types.User>,
  Partial<Types.User>
>;
export type UpdateDiscordRoles = BaseAuditLogAction<
  AuditLogActionType.UpdateDiscordRoles,
  any,
  any
>;
export type UpdateDiscordWebhooks = BaseAuditLogAction<
  AuditLogActionType.UpdateDiscordWebhooks,
  any[],
  any[]
>;
export type UpdateRawWebhooks = BaseAuditLogAction<
  AuditLogActionType.UpdateRawWebhooks,
  any[],
  any[]
>;
export type CadAPITokenRemoved = BaseAuditLogAction<
  AuditLogActionType.CadAPITokenRemoved,
  undefined,
  undefined
>;
export type CadAPITokenEnabled = BaseAuditLogAction<
  AuditLogActionType.CadAPITokenEnabled,
  undefined,
  undefined
>;
export type CadAutoSetPropertiesUpdate = BaseAuditLogAction<
  AuditLogActionType.CadAutoSetPropertiesUpdate,
  Types.AutoSetUserProperties | null,
  Types.AutoSetUserProperties
>;

export type ExpungementRequestAccepted = BaseAuditLogAction<
  AuditLogActionType.ExpungementRequestAccepted,
  undefined,
  Types.ExpungementRequest
>;
export type ExpungementRequestDeclined = BaseAuditLogAction<
  AuditLogActionType.ExpungementRequestDeclined,
  undefined,
  Types.ExpungementRequest
>;
export type NameChangeRequestAccepted = BaseAuditLogAction<
  AuditLogActionType.NameChangeRequestAccepted,
  undefined,
  Types.NameChangeRequest
>;
export type NameChangeRequestDeclined = BaseAuditLogAction<
  AuditLogActionType.NameChangeRequestDeclined,
  undefined,
  Types.NameChangeRequest
>;
export type ActiveWarrantAccepted = BaseAuditLogAction<
  AuditLogActionType.ActiveWarrantAccepted,
  undefined,
  Types.Warrant
>;
export type ActiveWarrantDeclined = BaseAuditLogAction<
  AuditLogActionType.ActiveWarrantDeclined,
  undefined,
  Types.Warrant
>;

export type UnitQualificationSuspended = BaseAuditLogAction<
  AuditLogActionType.UnitQualificationSuspended,
  undefined,
  { unitId: string; qualification: Types.UnitQualification }
>;
export type UnitQualificationAdd = BaseAuditLogAction<
  AuditLogActionType.UnitQualificationAdd,
  undefined,
  { unitId: string; qualification: Types.UnitQualification }
>;
export type UnitQualificationRemove = BaseAuditLogAction<
  AuditLogActionType.UnitQualificationRemove,
  undefined,
  { unitId: string; qualification: Types.UnitQualification }
>;
export type UnitDepartmentDeclined = BaseAuditLogAction<
  AuditLogActionType.UnitDepartmentDeclined,
  undefined,
  Types.Officer | Types.EmsFdDeputy
>;
export type UnitDepartmentAccepted = BaseAuditLogAction<
  AuditLogActionType.UnitDepartmentAccepted,
  undefined,
  Types.Officer | Types.EmsFdDeputy
>;
export type ValueAdd = BaseAuditLogAction<AuditLogActionType.ValueAdd, undefined, any>;
export type ValueUpdate = BaseAuditLogAction<AuditLogActionType.ValueUpdate, any, any>;
export type ValueRemove = BaseAuditLogAction<AuditLogActionType.ValueRemove, undefined, any>;
export type ValueBulkRemove = BaseAuditLogAction<
  AuditLogActionType.ValueBulkRemove,
  undefined,
  string[]
>;
export type LeoIncidentsPurged = BaseAuditLogAction<
  AuditLogActionType.LeoIncidentsPurged,
  undefined,
  string[]
>;
export type EmsIncidentsPurged = BaseAuditLogAction<
  AuditLogActionType.EmsIncidentsPurged,
  undefined,
  string[]
>;
export type Signal100Toggled = BaseAuditLogAction<
  AuditLogActionType.Signal100Toggled,
  undefined,
  { enabled?: boolean; user: Partial<Types.User> }
>;
export type Call911Create = BaseAuditLogAction<
  AuditLogActionType.Call911Create,
  undefined,
  Types.Call911
>;
export type CitizenRecordRemove = BaseAuditLogAction<
  AuditLogActionType.CitizenRecordRemove,
  undefined,
  string
>;
export type CitizenWarrantRemove = BaseAuditLogAction<
  AuditLogActionType.CitizenWarrantRemove,
  undefined,
  string
>;
