// based on
// https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

export const Feature = {
  BLEETER: "BLEETER",
  TOW: "TOW",
  TAXI: "TAXI",
  COURTHOUSE: "COURTHOUSE",
  TRUCK_LOGS: "TRUCK_LOGS",
  AOP: "AOP",
  BUSINESS: "BUSINESS",
  ALLOW_DUPLICATE_CITIZEN_NAMES: "ALLOW_DUPLICATE_CITIZEN_NAMES",
  DISCORD_AUTH: "DISCORD_AUTH",
  CALLS_911: "CALLS_911",
  WEAPON_REGISTRATION: "WEAPON_REGISTRATION",
  SOCIAL_SECURITY_NUMBERS: "SOCIAL_SECURITY_NUMBERS",
  CUSTOM_TEXTFIELD_VALUES: "CUSTOM_TEXTFIELD_VALUES",
  ACTIVE_DISPATCHERS: "ACTIVE_DISPATCHERS",
  ACTIVE_INCIDENTS: "ACTIVE_INCIDENTS",
  ALLOW_CITIZEN_UPDATE_LICENSE: "ALLOW_CITIZEN_UPDATE_LICENSE",
  ALLOW_REGULAR_LOGIN: "ALLOW_REGULAR_LOGIN",
  RADIO_CHANNEL_MANAGEMENT: "RADIO_CHANNEL_MANAGEMENT",
  ALLOW_CITIZEN_DELETION_BY_NON_ADMIN: "ALLOW_CITIZEN_DELETION_BY_NON_ADMIN",
  DMV: "DMV",
  BADGE_NUMBERS: "BADGE_NUMBERS",
  USER_API_TOKENS: "USER_API_TOKENS",
  CITIZEN_RECORD_APPROVAL: "CITIZEN_RECORD_APPROVAL",
  COMMON_CITIZEN_CARDS: "COMMON_CITIZEN_CARDS",
  STEAM_OAUTH: "STEAM_OAUTH",
  CREATE_USER_CITIZEN_LEO: "CREATE_USER_CITIZEN_LEO",
  LEO_TICKETS: "LEO_TICKETS",
  LEO_BAIL: "LEO_BAIL",
  COURTHOUSE_POSTS: "COURTHOUSE_POSTS",
  ACTIVE_WARRANTS: "ACTIVE_WARRANTS",
  CITIZEN_DELETE_ON_DEAD: "CITIZEN_DELETE_ON_DEAD",
  PANIC_BUTTON: "PANIC_BUTTON",
  WARRANT_STATUS_APPROVAL: "WARRANT_STATUS_APPROVAL",
  DIVISIONS: "DIVISIONS",
  TONES: "TONES",
  LICENSE_EXAMS: "LICENSE_EXAMS",
  CITIZEN_CREATION_RECORDS: "CITIZEN_CREATION_RECORDS",
  BUREAU_OF_FIREARMS: "BUREAU_OF_FIREARMS",
  CALL_911_APPROVAL: "CALL_911_APPROVAL",
  FORCE_DISCORD_AUTH: "FORCE_DISCORD_AUTH",
  FORCE_STEAM_AUTH: "FORCE_STEAM_AUTH",
  EDITABLE_SSN: "EDITABLE_SSN",
  EDITABLE_VIN: "EDITABLE_VIN",
  SIGNAL_100_CITIZEN: "SIGNAL_100_CITIZEN",
} as const;

export type Feature = (typeof Feature)[keyof typeof Feature];

export const JailTimeScale = {
  HOURS: "HOURS",
  MINUTES: "MINUTES",
  SECONDS: "SECONDS",
} as const;

export type JailTimeScale = (typeof JailTimeScale)[keyof typeof JailTimeScale];

export const DiscordWebhookType = {
  CALL_911: "CALL_911",
  PANIC_BUTTON: "PANIC_BUTTON",
  UNIT_STATUS: "UNIT_STATUS",
  BOLO: "BOLO",
  CITIZEN_RECORD: "CITIZEN_RECORD",
  VEHICLE_IMPOUNDED: "VEHICLE_IMPOUNDED",
  WARRANTS: "WARRANTS",
} as const;

export type DiscordWebhookType = (typeof DiscordWebhookType)[keyof typeof DiscordWebhookType];

export const Rank = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type Rank = (typeof Rank)[keyof typeof Rank];

export const WhitelistStatus = {
  ACCEPTED: "ACCEPTED",
  PENDING: "PENDING",
  DECLINED: "DECLINED",
} as const;

export type WhitelistStatus = (typeof WhitelistStatus)[keyof typeof WhitelistStatus];

export const StatusViewMode = {
  FULL_ROW_COLOR: "FULL_ROW_COLOR",
  DOT_COLOR: "DOT_COLOR",
} as const;

export type StatusViewMode = (typeof StatusViewMode)[keyof typeof StatusViewMode];

export const TableActionsAlignment = {
  NONE: "NONE",
  LEFT: "LEFT",
  RIGHT: "RIGHT",
} as const;

export type TableActionsAlignment =
  (typeof TableActionsAlignment)[keyof typeof TableActionsAlignment];

export const VehicleInspectionStatus = {
  PASSED: "PASSED",
  FAILED: "FAILED",
} as const;

export type VehicleInspectionStatus =
  (typeof VehicleInspectionStatus)[keyof typeof VehicleInspectionStatus];

export const VehicleTaxStatus = {
  TAXED: "TAXED",
  UNTAXED: "UNTAXED",
} as const;

export type VehicleTaxStatus = (typeof VehicleTaxStatus)[keyof typeof VehicleTaxStatus];

export const ValueType = {
  LICENSE: "LICENSE",
  GENDER: "GENDER",
  ETHNICITY: "ETHNICITY",
  VEHICLE: "VEHICLE",
  WEAPON: "WEAPON",
  BLOOD_GROUP: "BLOOD_GROUP",
  BUSINESS_ROLE: "BUSINESS_ROLE",
  CODES_10: "CODES_10",
  PENAL_CODE: "PENAL_CODE",
  DEPARTMENT: "DEPARTMENT",
  OFFICER_RANK: "OFFICER_RANK",
  DIVISION: "DIVISION",
  DRIVERSLICENSE_CATEGORY: "DRIVERSLICENSE_CATEGORY",
  IMPOUND_LOT: "IMPOUND_LOT",
  VEHICLE_FLAG: "VEHICLE_FLAG",
  CITIZEN_FLAG: "CITIZEN_FLAG",
  QUALIFICATION: "QUALIFICATION",
  CALL_TYPE: "CALL_TYPE",
  ADDRESS: "ADDRESS",
  EMERGENCY_VEHICLE: "EMERGENCY_VEHICLE",
  ADDRESS_FLAG: "ADDRESS_FLAG",
  VEHICLE_TRIM_LEVEL: "VEHICLE_TRIM_LEVEL",
} as const;

export type ValueType = (typeof ValueType)[keyof typeof ValueType];

export const ValueLicenseType = {
  LICENSE: "LICENSE",
  REGISTRATION_STATUS: "REGISTRATION_STATUS",
  INSURANCE_STATUS: "INSURANCE_STATUS",
} as const;

export type ValueLicenseType = (typeof ValueLicenseType)[keyof typeof ValueLicenseType];

export const DepartmentType = {
  LEO: "LEO",
  EMS_FD: "EMS_FD",
} as const;

export type DepartmentType = (typeof DepartmentType)[keyof typeof DepartmentType];

export const DriversLicenseCategoryType = {
  AUTOMOTIVE: "AUTOMOTIVE",
  AVIATION: "AVIATION",
  WATER: "WATER",
  FIREARM: "FIREARM",
} as const;

export type DriversLicenseCategoryType =
  (typeof DriversLicenseCategoryType)[keyof typeof DriversLicenseCategoryType];

export const EmployeeAsEnum = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type EmployeeAsEnum = (typeof EmployeeAsEnum)[keyof typeof EmployeeAsEnum];

export const QualificationValueType = {
  QUALIFICATION: "QUALIFICATION",
  AWARD: "AWARD",
} as const;

export type QualificationValueType =
  (typeof QualificationValueType)[keyof typeof QualificationValueType];

export const ShouldDoType = {
  SET_OFF_DUTY: "SET_OFF_DUTY",
  SET_ON_DUTY: "SET_ON_DUTY",
  SET_ASSIGNED: "SET_ASSIGNED",
  SET_STATUS: "SET_STATUS",
  PANIC_BUTTON: "PANIC_BUTTON",
  EN_ROUTE: "EN_ROUTE",
  ON_SCENE: "ON_SCENE",
  UNAVAILABLE: "UNAVAILABLE",
} as const;

export type ShouldDoType = (typeof ShouldDoType)[keyof typeof ShouldDoType];

export const StatusValueType = {
  STATUS_CODE: "STATUS_CODE",
  SITUATION_CODE: "SITUATION_CODE",
} as const;

export type StatusValueType = (typeof StatusValueType)[keyof typeof StatusValueType];

export const WhatPages = {
  DISPATCH: "DISPATCH",
  EMS_FD: "EMS_FD",
  LEO: "LEO",
} as const;

export type WhatPages = (typeof WhatPages)[keyof typeof WhatPages];

export const BoloType = {
  VEHICLE: "VEHICLE",
  PERSON: "PERSON",
  OTHER: "OTHER",
} as const;

export type BoloType = (typeof BoloType)[keyof typeof BoloType];

export const RecordType = {
  ARREST_REPORT: "ARREST_REPORT",
  TICKET: "TICKET",
  WRITTEN_WARNING: "WRITTEN_WARNING",
} as const;

export type RecordType = (typeof RecordType)[keyof typeof RecordType];

export const ReleaseType = {
  TIME_OUT: "TIME_OUT",
  BAIL_POSTED: "BAIL_POSTED",
} as const;

export type ReleaseType = (typeof ReleaseType)[keyof typeof ReleaseType];

export const WarrantStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type WarrantStatus = (typeof WarrantStatus)[keyof typeof WarrantStatus];

export const ExpungementRequestStatus = {
  ACCEPTED: "ACCEPTED",
  DENIED: "DENIED",
  PENDING: "PENDING",
  CANCELED: "CANCELED",
} as const;

export type ExpungementRequestStatus =
  (typeof ExpungementRequestStatus)[keyof typeof ExpungementRequestStatus];

export const LicenseExamPassType = {
  PASSED: "PASSED",
  FAILED: "FAILED",
} as const;

export type LicenseExamPassType = (typeof LicenseExamPassType)[keyof typeof LicenseExamPassType];

export const LicenseExamStatus = {
  IN_PROGRESS: "IN_PROGRESS",
  PASSED: "PASSED",
  FAILED: "FAILED",
} as const;

export type LicenseExamStatus = (typeof LicenseExamStatus)[keyof typeof LicenseExamStatus];

export const LicenseExamType = {
  DRIVER: "DRIVER",
  FIREARM: "FIREARM",
  WATER: "WATER",
  PILOT: "PILOT",
} as const;

export type LicenseExamType = (typeof LicenseExamType)[keyof typeof LicenseExamType];

export const CustomFieldCategory = {
  CITIZEN: "CITIZEN",
  WEAPON: "WEAPON",
  VEHICLE: "VEHICLE",
} as const;

export type CustomFieldCategory = (typeof CustomFieldCategory)[keyof typeof CustomFieldCategory];

export const PaymentStatus = {
  PAID: "PAID",
  UNPAID: "UNPAID",
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PenalCodeType = {
  INFRACTION: "INFRACTION",
  MISDEMEANOR: "MISDEMEANOR",
  FELONY: "FELONY",
} as const;

export type PenalCodeType = (typeof PenalCodeType)[keyof typeof PenalCodeType];

export const ActiveToneType = {
  LEO: "LEO",
  EMS_FD: "EMS_FD",
  SHARED: "SHARED",
} as const;

export type ActiveToneType = (typeof ActiveToneType)[keyof typeof ActiveToneType];
