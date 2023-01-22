export enum AuditLogActionType {
  UserBan = "UserBan",
  UserUnban = "UserUnban",
  UserUpdate = "UserUpdate",
  UserDelete = "UserDelete",
  UserTempPassword = "UserTempPassword",
  UsersPruned = "UsersPruned",
  UserPermissionsUpdate = "UserPermissionsUpdate",
  UserRolesUpdate = "UserRolesUpdate",
  UserApiTokenDelete = "UserApiTokenDelete",
  User2FADelete = "User2FADelete",
  CadAPITokenRegenerated = "CadAPITokenRegenerated",
  CADFeaturesUpdate = "CADFeaturesUpdate",

  CitizenUpdate = "CitizenUpdate",
  CitizenDelete = "CitizenDelete",

  UnitUpdate = "UnitUpdate",
  UnitDelete = "UnitDelete",
  UnitsSetOffDuty = "UnitsSetOffDuty",
  TemporaryUnitCreate = "TemporaryUnitCreate",
  TemporaryUnitUpdate = "TemporaryUnitUpdate",

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

  Calls911Purge = "Calls911Purge",
}
