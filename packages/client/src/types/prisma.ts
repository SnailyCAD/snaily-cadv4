/* eslint-disable capitalized-comments */
/**
 * Model cad
 */

import { FullRecord } from "components/leo/modals/NameSearchModal/RecordsArea";
import { FullDeputy, FullOfficer } from "state/dispatchState";
import { JsonArray } from "type-fest";

export type cad = {
  id: string;
  name: string;
  ownerId: string;
  areaOfPlay: string | null;
  steamApiKey: string | null;
  registrationCode: string | null;
  discordWebhookURL: string | null;
  logoId: string | null;
  whitelisted: boolean;
  businessWhitelisted: boolean;
  towWhitelisted: boolean;
  apiTokenId: string | null;
  disabledFeatures: Feature[];
  apiToken: ApiToken | null;
  miscCadSettings?: MiscCadSettings | null;
  autoSetUserPropertiesId: string | null;
  autoSetUserProperties: AutoSetUserProperties | null;
};

/**
 * Model MiscCadSettings
 */

export type MiscCadSettings = {
  id: string;
  heightPrefix: string;
  weightPrefix: string;
  maxCitizensPerUser: number | null;
  maxPlateLength: number;
  maxBusinessesPerCitizen: number | null;
  maxDivisionsPerOfficer: number | null;
  maxOfficersPerUser: number | null;
  pairedUnitSymbol: string | null;
  callsignTemplate: string | null;
  signal100Enabled: boolean;
  allowDuplicateCitizenNames: boolean;
  liveMapURL: string | null;
  roleplayEnabled: boolean | null;
  authScreenBgImageId: string | null;
  authScreenHeaderImageId: string | null;
};

/**
 * Model AutoSetUserProperties
 *
 */
export type AutoSetUserProperties = {
  id: string;
  leo: boolean | null;
  dispatch: boolean | null;
  emsFd: boolean | null;
};

/**
 * Model ApiToken
 */

export type ApiToken = {
  id: string;
  enabled: boolean;
  token: string | null;
  routes: string[];
};

/**
 * Model User
 */

export type User = {
  id: string;
  username: string;
  rank: Rank;
  isLeo: boolean;
  isSupervisor: boolean;
  isEmsFd: boolean;
  isDispatch: boolean;
  isTow: boolean;
  banned: boolean;
  banReason: boolean | null;
  avatarUrl: string | null;
  steamId: string | null;
  whitelistStatus: WhitelistStatus;
  isDarkTheme: boolean;
  hasTempPassword: boolean;
  statusViewMode: StatusViewMode;
  discordId: string | null;
};

/**
 * Model Citizen
 */

export type Citizen = {
  id: string;
  userId: string;
  name: string;
  surname: string;
  dateOfBirth: Date;
  genderId: string;
  gender: Value<"GENDER">;
  ethnicityId: string;
  ethnicity: Value<"ETHNICITY">;
  hairColor: string;
  eyeColor: string;
  address: string;
  postal: string | null;
  height: string;
  weight: string;
  driversLicenseId: string | null;
  driversLicense: Value<"LICENSE"> | null;
  weaponLicenseId: string | null;
  weaponLicense: Value<"LICENSE"> | null;
  pilotLicenseId: string | null;
  pilotLicense: Value<"LICENSE"> | null;
  ccwId: string | null;
  ccw: Value<"LICENSE"> | null;
  imageId: string | null;
  note: string | null;
  dead: boolean | null;
  dateOfDead: Date | null;
  dlCategory: DriversLicenseCategoryValue[];
  phoneNumber: string | null;
  /** nullable since no default is set. */
  socialSecurityNumber: string | null;
  occupation: string | null;
};

/**
 * Model RegisteredVehicle
 */

export type RegisteredVehicle = {
  id: string;
  userId: string;
  citizenId: string;
  plate: string;
  vinNumber: string;
  modelId: string;
  model: VehicleValue;
  color: string;
  createdAt: Date;
  registrationStatus: Value<"LICENSE">;
  registrationStatusId: string;
  insuranceStatus: string;
  reportedStolen: boolean;
  impounded: boolean;
  citizen?: Citizen;
};

/**
 * Model Weapon
 */

export type Weapon = {
  id: string;
  userId: string;
  citizenId: string;
  serialNumber: string;
  registrationStatus: Value<"LICENSE">;
  registrationStatusId: string;
  model: VehicleValue;
  modelId: string;
  createdAt: string;
  updatedAt: string;
};

/**
 * Model MedicalRecord
 */

export type MedicalRecord = {
  id: string;
  userId: string;
  citizenId: string;
  type: string;
  description: string;
  bloodGroup: Value<"BLOOD_GROUP"> | null;
  bloodGroupId: string | null;
};

/**
 * Model Value
 */

export type Value<Type extends ValueType = ValueType> = {
  id: string;
  type: Type;
  value: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  position: number | null;
  licenseType?: ValueLicenseType | null;
};

/**
 * Model BleeterPost
 */

export type BleeterPost = {
  id: string;
  userId: string;
  title: string;
  body: string;
  bodyData?: JsonArray;
  imageId: string | null;
};

/**
 * Model TowCall
 */

export type TowCall = {
  id: string;
  createdAt: Date;
  userId: string;
  assignedUnitId: string | null;
  location: string;
  postal: string | null;
  description: string;
  descriptionData?: JsonArray;
  creatorId: string;
};

/**
 * Model TaxiCall
 */

export type TaxiCall = {
  id: string;
  createdAt: Date;
  userId: string;
  assignedUnitId: string | null;
  location: string;
  postal: string | null;
  description: string;
  descriptionData?: JsonArray;
  creatorId: string;
};

/**
 * Model Business
 */

export type Business = {
  id: string;
  userId: string;
  citizenId: string;
  name: string;
  whitelisted: boolean;
  address: string;
  postal: string | null;
  createdAt: Date;
  status: WhitelistStatus | null;
};

/**
 * Model Employee
 */

export type Employee = {
  id: string;
  userId: string;
  citizenId: string;
  businessId: string;
  roleId: string;
  employeeOfTheMonth: boolean;
  canCreatePosts: boolean;
  whitelistStatus: WhitelistStatus;
};

/**
 * Model BusinessPost
 */

export type BusinessPost = {
  id: string;
  userId: string;
  employeeId: string;
  businessId: string;
  title: string;
  body: string;
  bodyData?: JsonArray;
};

/**
 * Model EmployeeValue
 */

export type EmployeeValue = {
  id: string;
  valueId: string;
  as: EmployeeAsEnum;
  value: Value<"BUSINESS_ROLE">;
};

/**
 * Model Officer
 */

export type Officer = {
  id: string;
  departmentId: string;
  divisionId: string | null;
  callsign: string;
  callsign2: string;
  rankId: string;
  statusId: string | null;
  status: StatusValue | null;
  suspended: boolean;
  citizen: Citizen;
  citizenId: string;
  userId: string;
  call911Id: string | null;
  badgeNumber: number | null;
  imageId: string | null;
};

/**
 * Model OfficerLog
 */

export type OfficerLog = {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  userId: string;
  officerId: string;
};

/**
 * Model StatusValue
 */

export type StatusValue = {
  id: string;
  valueId: string;
  value: Value<"CODES_10">;
  shouldDo: ShouldDoType;
  whatPages: WhatPages[];
  departmentId: string;
  color?: string;
  type: StatusValueType;
};

/**
 * Model Call911
 */

export type Call911 = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  assignedUnits: AssignedUnit[];
  location: string;
  postal: string | null;
  description: string;
  descriptionData?: JsonArray;
  name: string;
  position: Position | null;
};

/**
 * Model Position
 */
export type Position = {
  id: string;
  lng: number;
  lat: number;
};

/**
 * Model Bolo
 */

export type Bolo = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: BoloType;
  description: string;
  plate: string | null;
  model: string | null;
  name: string | null;
  color: string | null;
  officerId: string | null;
};

/**
 * Model PenalCode
 */

export type PenalCode = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string;
  descriptionData?: JsonArray;
  warningApplicableId: string | null;
  warningApplicable: WarningApplicable | null;
  warningNotApplicableId: string | null;
  warningNotApplicable: WarningNotApplicable | null;
  group: PenalCodeGroup | null;
  groupId: string | null;
  position: number | null;
};

/**
 * Model PenalCodeGroup
 *
 */
export type PenalCodeGroup = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  position: number | null;
};

/**
 * Model WarningApplicable
 *
 */
export type WarningApplicable = {
  id: string;
  fines: [number, number];
};

/**
 * Model WarningNotApplicable
 *
 */
export type WarningNotApplicable = {
  id: string;
  fines: [number, number];
  prisonTerm: [number, number];
  bail: [number, number];
};

/**
 * Model Violation
 *
 */
export type Violation = {
  id: string;
  fine: number | null;
  jailTime: number | null;
  bail: number | null;
  penalCodeId: string;
  penalCode: PenalCode;
};

/**
 * Model Record
 */

export type Record = {
  id: string;
  type: RecordType;
  citizenId: string;
  officerId: string;
  createdAt: Date;
  postal: string;
  notes: string | null;
  releaseId: string | null;
  release: RecordRelease | null;
};

/**
 * Model RecordRelease
 *
 */
export type RecordRelease = {
  id: string;
  type: ReleaseType;
  citizenId: string | null;
  releasedBy: Citizen | null;
};

/**
 * Model RecordLog
 *
 */
export type RecordLog = {
  id: string;
  citizenId: string;
  recordId: string | null;
  records: FullRecord | null;
  warrantId: string | null;
  warrant: (Warrant & { officer: FullOfficer }) | null;
};

/**
 * Model DivisionValue
 */

export type DivisionValue = {
  id: string;
  valueId: string;
  value: Value<"DIVISION">;
  departmentId: string | null;
  department: DepartmentValue;
  callsign: string | null;
};

/**
 * Model DepartmentValue
 */

export type DepartmentValue = {
  id: string;
  valueId: string;
  value: Value<"DEPARTMENT">;
  callsign: string | null;
  type: DepartmentType;
};

/**
 * Model EmsFdDeputy
 */

export type EmsFdDeputy = {
  id: string;
  departmentId: string;
  callsign: string;
  callsign2: string;
  divisionId: string;
  rankId: string | null;
  status: StatusValue | null;
  statusId: string | null;
  suspended: boolean;
  badgeNumber: number | null;
  citizen: Citizen;
  citizenId: string;
  userId: string;
  imageId: string | null;
  combinedLeoUnitId: string | null;
};

/**
 * Model Call911Event
 */

export type Call911Event = {
  id: string;
  createdAt: Date;
  call911Id: string;
  description: string;
};

/**
 * Model TruckLog
 */

export type TruckLog = {
  id: string;
  citizenId: string | null;
  userId: string;
  vehicleId: string | null;
  startedAt: string;
  endedAt: string;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Model Warrant
 */

export type Warrant = {
  id: string;
  citizenId: string;
  officerId: string;
  description: string;
  status: WarrantStatus;
  createdAt: Date;
};

/**
 * Model ExpungementRequest
 *
 */
export type ExpungementRequest = {
  id: string;
  citizenId: string;
  status: ExpungementRequestStatus;
  createdAt: Date;
};

/**
 * Model DriversLicenseCategoryValue
 */

export type DriversLicenseCategoryValue = {
  id: string;
  value: Value<"DRIVERSLICENSE_CATEGORY">;
  valueId: string;
  type: DriversLicenseCategoryType;
};

/**
 * Model AssignedUnit
 */

export type AssignedUnit = {
  id: string;
  officerId: string | null;
  emsFdDeputyId: string | null;
  call911Id: string | null;
  unit: FullDeputy | FullOfficer | CombinedLeoUnit;
};

/**
 * Model VehicleValue
 */

export type VehicleValue = {
  id: string;
  valueId: string;
  value: Value<"VEHICLE">;
  hash: string | null;
};

/**
 * Model ImpoundedVehicle
 */

export type ImpoundedVehicle = {
  id: string;
  registeredVehicleId: string;
  valueId: string;
  location: Value<"IMPOUND_LOT">;
  vehicle: RegisteredVehicle;
};

/**
 * Model LeoIncident
 */

export type LeoIncident = {
  id: string;
  caseNumber: number;
  description: string;
  descriptionData?: JsonArray;
  creatorId: string;
  firearmsInvolved: boolean;
  injuriesOrFatalities: boolean;
  arrestsMade: boolean;
  createdAt: Date;
};

/**
 * Model CombinedLeoUnit
 *
 */
export type CombinedLeoUnit = {
  id: string;
  callsign: string;
  statusId: string | null;
  status: StatusValue | null;
  officers: FullOfficer[];
};

/**
 * Model ActiveDispatchers
 *
 */
export type ActiveDispatchers = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};

/**
 * Enums
 */

// Based on
// https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

export const StatusViewMode = {
  FULL_ROW_COLOR: "FULL_ROW_COLOR",
  DOT_COLOR: "DOT_COLOR",
} as const;

export type StatusViewMode = typeof StatusViewMode[keyof typeof StatusViewMode];

export const rank = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

export type Rank = typeof rank[keyof typeof rank];

export const whitelistStatus = {
  ACCEPTED: "ACCEPTED",
  PENDING: "PENDING",
  DECLINED: "DECLINED",
} as const;

export type WhitelistStatus = typeof whitelistStatus[keyof typeof whitelistStatus];

export const valueType = {
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
} as const;

export type ValueType = typeof valueType[keyof typeof valueType];

export const feature = {
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
  DISALLOW_TEXTFIELD_SELECTION: "DISALLOW_TEXTFIELD_SELECTION",
  ACTIVE_DISPATCHERS: "ACTIVE_DISPATCHERS",
} as const;

export type Feature = typeof feature[keyof typeof feature];

export const EmployeeAsEnum = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  EMPLOYEE: "EMPLOYEE",
} as const;

export type EmployeeAsEnum = typeof EmployeeAsEnum[keyof typeof EmployeeAsEnum];

export const ShouldDoType = {
  SET_OFF_DUTY: "SET_OFF_DUTY",
  SET_ON_DUTY: "SET_ON_DUTY",
  SET_ASSIGNED: "SET_ASSIGNED",
  SET_STATUS: "SET_STATUS",
  PANIC_BUTTON: "PANIC_BUTTON",
} as const;

export type ShouldDoType = typeof ShouldDoType[keyof typeof ShouldDoType];

export const WhatPages = {
  DISPATCH: "DISPATCH",
  EMS_FD: "EMS_FD",
  LEO: "LEO",
} as const;

export type WhatPages = typeof WhatPages[keyof typeof WhatPages];

export const BoloType = {
  VEHICLE: "VEHICLE",
  PERSON: "PERSON",
  OTHER: "OTHER",
} as const;

export type BoloType = typeof BoloType[keyof typeof BoloType];

export const StatusEnum = {
  ON_DUTY: "ON_DUTY",
  OFF_DUTY: "OFF_DUTY",
} as const;

export type StatusEnum = typeof StatusEnum[keyof typeof StatusEnum];

export const RecordType = {
  ARREST_REPORT: "ARREST_REPORT",
  TICKET: "TICKET",
  WRITTEN_WARNING: "WRITTEN_WARNING",
} as const;

export type RecordType = typeof RecordType[keyof typeof RecordType];

export const WarrantStatus = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
} as const;

export type WarrantStatus = typeof WarrantStatus[keyof typeof WarrantStatus];

export const DriversLicenseCategoryType = {
  AUTOMOTIVE: "AUTOMOTIVE",
  AVIATION: "AVIATION",
  WATER: "WATER",
} as const;

export type DriversLicenseCategoryType =
  typeof DriversLicenseCategoryType[keyof typeof DriversLicenseCategoryType];

export const DepartmentType = {
  LEO: "LEO",
  EMS_FD: "EMS_FD",
} as const;

export type DepartmentType = typeof DepartmentType[keyof typeof DepartmentType];

export const StatusValueType = {
  STATUS_CODE: "STATUS_CODE",
  SITUATION_CODE: "SITUATION_CODE",
} as const;

export type StatusValueType = typeof StatusValueType[keyof typeof StatusValueType];

export const ReleaseType = {
  TIME_OUT: "TIME_OUT",
  BAIL_POSTED: "BAIL_POSTED",
};

export type ReleaseType = typeof ReleaseType[keyof typeof ReleaseType];

export const ExpungementRequestStatus = {
  ACCEPTED: "ACCEPTED",
  DENIED: "DENIED",
  PENDING: "PENDING",
};

export type ExpungementRequestStatus =
  typeof ExpungementRequestStatus[keyof typeof ExpungementRequestStatus];

export const ValueLicenseType = {
  LICENSE: "LICENSE",
  REGISTRATION_STATUS: "REGISTRATION_STATUS",
};

export type ValueLicenseType = typeof ValueLicenseType[keyof typeof ValueLicenseType];
