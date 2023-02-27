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
  UserWhitelistStatusChange = "UserWhitelistStatusChange",

  CadAPITokenRegenerated = "CadAPITokenRegenerated",
  CADFeaturesUpdate = "CADFeaturesUpdate",

  CitizenUpdate = "CitizenUpdate",
  CitizenDelete = "CitizenDelete",

  UnitUpdate = "UnitUpdate",
  UnitDelete = "UnitDelete",
  UnitsSetOffDuty = "UnitsSetOffDuty",
  TemporaryUnitCreate = "TemporaryUnitCreate",
  TemporaryUnitUpdate = "TemporaryUnitUpdate",
  UnitsPruned = "UnitsPruned",
  UnitQualificationSuspended = "UnitQualificationSuspended",
  UnitQualificationAdd = "UnitQualificationAdd",
  UnitQualificationRemove = "UnitQualificationRemove",
  UnitDepartmentDeclined = "UnitDepartmentDeclined",
  UnitDepartmentAccepted = "UnitDepartmentAccepted",

  BusinessUpdate = "BusinessUpdate",
  BusinessDelete = "BusinessDelete",
  BusinessEmployeeUpdate = "BusinessEmployeeUpdate",
  BusinessEmployeeFire = "BusinessEmployeeFire",

  CustomFieldCreate = "CustomFieldCreate",
  CustomFieldUpdate = "CustomFieldUpdate",
  CustomFieldDelete = "CustomFieldDelete",

  CustomRoleCreate = "CustomRoleCreate",
  CustomRoleUpdate = "CustomRoleUpdate",
  CustomRoleDelete = "CustomRoleDelete",

  CadSettingsUpdate = "CadSettingsUpdate",
  MiscCadSettingsUpdate = "MiscCadSettingsUpdate",
  UpdateDiscordRoles = "UpdateDiscordRoles",
  UpdateDiscordWebhooks = "UpdateDiscordWebhooks",
  CadAPITokenRemoved = "CadAPITokenRemoved",
  CadAPITokenEnabled = "CadAPITokenEnabled",
  CadAutoSetPropertiesUpdate = "CadAutoSetPropertiesUpdate",
  UpdateRawWebhooks = "UpdateRawWebhooks",

  ExpungementRequestAccepted = "ExpungementRequestAccepted",
  ExpungementRequestDeclined = "ExpungementRequestDeclined",

  NameChangeRequestAccepted = "NameChangeRequestAccepted",
  NameChangeRequestDeclined = "NameChangeRequestDeclined",

  ActiveWarrantAccepted = "ActiveWarrantAccepted",
  ActiveWarrantDeclined = "ActiveWarrantDeclined",

  ValueAdd = "ValueAdd",
  ValueUpdate = "ValueUpdate",
  ValueRemove = "ValueRemove",
  ValueBulkRemove = "ValueBulkRemove",

  Calls911Purge = "Calls911Purge",
}
