export enum AuditLogActionType {
  UserBan = "UserBan",
  UserUnban = "UserUnban",
  UserUpdate = "UserUpdate",
  UserDelete = "UserDelete",
  UserTempPassword = "UserTempPassword",
  UsersPruned = "UsersPruned",
  UserPermissionsUpdate = "UserPermissionsUpdate",
  UserRolesUpdate = "UserRolesUpdate",

  CitizenUpdate = "CitizenUpdate",
  CitizenDelete = "CitizenDelete",

  UnitUpdate = "UnitUpdate",
  UnitDelete = "UnitDelete",
  UnitsSetOffDuty = "UnitsSetOffDuty",

  BusinessUpdate = "BusinessUpdate",
  BusinessDelete = "BusinessDelete",

  CustomFieldCreate = "CustomFieldCreate",
  CustomFieldUpdate = "CustomFieldUpdate",
  CustomFieldDelete = "CustomFieldDelete",

  CustomRoleCreate = "CustomRoleCreate",
  CustomRoleUpdate = "CustomRoleUpdate",
  CustomRoleDelete = "CustomRoleDelete",

  CadSettingsUpdate = "CadSettingsUpdate",
  MiscCadSettingsUpdate = "MiscCadSettingsUpdate",
}
