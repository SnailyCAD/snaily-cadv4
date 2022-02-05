/* eslint-disable capitalized-comments */
import type { JsonArray } from "type-fest";

type DescriptionData = JsonArray;

/**
 * Model cad
 *
 */
export interface cad {
  id: string;
  name: string;
  ownerId: string;
  areaOfPlay: string | null;
  steamApiKey: string | null;
  discordWebhookURL: string | null;
  whitelisted: boolean;
  towWhitelisted: boolean;
  businessWhitelisted: boolean;
  maxPlateLength: number;
  liveMapSocketURl: string | null;
  logoId: string | null;
  registrationCode: string | null;
  disabledFeatures: Feature[];
  miscCadSettingsId: string | null;
  miscCadSettings: MiscCadSettings | null;
  apiTokenId: string | null;
  apiToken?: ApiToken | null;
  createdAt: Date;
  updatedAt: Date;
  autoSetUserPropertiesId: string | null;
  autoSetUserProperties: AutoSetUserProperties | null;
}

/**
 * Model MiscCadSettings
 *
 */
export interface MiscCadSettings {
  id: string;
  heightPrefix: string;
  weightPrefix: string;
  maxCitizensPerUser: number | null;
  maxOfficersPerUser: number | null;
  maxPlateLength: number;
  maxBusinessesPerCitizen: number | null;
  maxDivisionsPerOfficer: number | null;
  callsignTemplate: string;
  pairedUnitSymbol: string;
  signal100Enabled: boolean;
  liveMapURL: string | null;
  roleplayEnabled: boolean | null;
  authScreenBgImageId: string | null;
  authScreenHeaderImageId: string | null;
}

/**
 * Model AutoSetUserProperties
 *
 */
export interface AutoSetUserProperties {
  id: string;
  leo: boolean | null;
  dispatch: boolean | null;
  emsFd: boolean | null;
}

/**
 * Model ApiToken
 *
 */
export interface ApiToken {
  id: string;
  enabled: boolean;
  token: string | null;
  routes: string[];
}

/**
 * Model User
 *
 */
export interface User {
  id: string;
  username: string;
  password: string;
  rank: Rank;
  isLeo: boolean;
  isSupervisor: boolean;
  isEmsFd: boolean;
  isDispatch: boolean;
  isTow: boolean;
  banned: boolean;
  banReason: string | null;
  avatarUrl: string | null;
  steamId: string | null;
  whitelistStatus: WhitelistStatus;
  isDarkTheme: boolean;
  tempPassword: string | null;
  statusViewMode: StatusViewMode;
  tableActionsAlignment: TableActionsAlignment;
  createdAt: Date;
  updatedAt: Date;
  discordId: string | null;
  hasTempPassword?: boolean;
  twoFactorEnabled?: boolean;
}

/**
 * Model User2FA
 *
 */
export interface User2FA {
  id: string;
  secret: string;
  userId: string;
}

/**
 * Model Citizen
 *
 */
export interface Citizen {
  id: string;
  socialSecurityNumber: string | null;
  userId: string | null;
  name: string;
  surname: string;
  dateOfBirth: Date;
  genderId: string;
  gender: Value<ValueType.GENDER>;
  ethnicityId: string;
  ethnicity: Value<ValueType.ETHNICITY>;
  hairColor: string;
  eyeColor: string;
  address: string;
  postal: string | null;
  height: string;
  weight: string;
  driversLicenseId: string | null;
  driversLicense: Value<ValueType.LICENSE> | null;
  weaponLicenseId: string | null;
  weaponLicense: Value<ValueType.LICENSE> | null;
  pilotLicenseId: string | null;
  pilotLicense: Value<ValueType.LICENSE> | null;
  ccwId: string | null;
  ccw: Value<ValueType.LICENSE> | null;
  imageId: string | null;
  note: string | null;
  dead: boolean | null;
  arrested: boolean | null;
  phoneNumber: string | null;
  dateOfDead: Date | null;
  occupation: string | null;
  createdAt: Date;
  updatedAt: Date;
  dlCategory: DriversLicenseCategoryValue[];
}

/**
 * Model RegisteredVehicle
 *
 */
export interface RegisteredVehicle {
  id: string;
  userId: string | null;
  citizenId: string;
  citizen: Citizen;
  vinNumber: string;
  plate: string;
  modelId: string;
  model: VehicleValue;
  color: string;
  createdAt: Date;
  updatedAt: Date;
  registrationStatusId: string;
  registrationStatus: Value<ValueType.LICENSE>;
  insuranceStatus: string;
  reportedStolen: boolean;
  impounded: boolean;
}

/**
 * Model Weapon
 *
 */
export interface Weapon {
  id: string;
  userId: string | null;
  citizenId: string;
  createdAt: Date;
  updatedAt: Date;
  serialNumber: string;
  registrationStatusId: string;
  registrationStatus: Value<ValueType.LICENSE>;
  modelId: string;
  model: WeaponValue;
}

/**
 * Model MedicalRecord
 *
 */
export interface MedicalRecord {
  id: string;
  userId: string | null;
  citizenId: string;
  createdAt: Date;
  updatedAt: Date;
  type: string | null;
  description: string | null;
  bloodGroupId: string | null;
  bloodGroup: Value<ValueType.BLOOD_GROUP> | null;
}

/**
 * Model Value
 *
 */
export interface Value<Type extends ValueType> {
  id: string;
  type: Type;
  value: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  position: number | null;
  licenseType: ValueLicenseType | null;
}

/**
 * Model PenalCode
 *
 */
export interface PenalCode {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  description: string | null;
  descriptionData: DescriptionData | null;
  warningApplicableId: string | null;
  warningApplicable: WarningApplicable | null;
  warningNotApplicableId: string | null;
  warningNotApplicable: WarningNotApplicable | null;
  position: number | null;
  groupId: string | null;
}

/**
 * Model PenalCodeGroup
 *
 */
export interface PenalCodeGroup {
  id: string;
  position: number | null;
  createdAt: Date;
  updatedAt: Date;
  name: string;
}

/**
 * Model WarningApplicable
 *
 */
export interface WarningApplicable {
  id: string;
  fines: number[];
}

/**
 * Model WarningNotApplicable
 *
 */
export interface WarningNotApplicable {
  id: string;
  fines: number[];
  prisonTerm: number[];
  bail: number[];
}

/**
 * Model Violation
 *
 */
export interface Violation {
  id: string;
  fine: number | null;
  jailTime: number | null;
  bail: number | null;
  penalCodeId: string;
  penalCode: PenalCode;
}

/**
 * Model DivisionValue
 *
 */
export interface DivisionValue {
  id: string;
  valueId: string;
  value: Value<ValueType.DIVISION>;
  departmentId: string;
  department: DepartmentValue;
  callsign: string | null;
}

/**
 * Model DepartmentValue
 *
 */
export interface DepartmentValue {
  id: string;
  valueId: string;
  value: Value<ValueType.DEPARTMENT>;
  callsign: string | null;
  whitelisted: boolean;
  isDefaultDepartment: boolean;
  type: DepartmentType;
}

/**
 * Model DriversLicenseCategoryValue
 *
 */
export interface DriversLicenseCategoryValue {
  id: string;
  valueId: string;
  value: Value<ValueType.DRIVERSLICENSE_CATEGORY>;
  type: DriversLicenseCategoryType;
}

/**
 * Model VehicleValue
 *
 */
export interface VehicleValue {
  id: string;
  valueId: string;
  value: Value<ValueType.VEHICLE>;
  hash: string | null;
}

/**
 * Model WeaponValue
 *
 */
export interface WeaponValue {
  id: string;
  valueId: string;
  value: Value<ValueType.WEAPON>;
  hash: string | null;
}

/**
 * Model Notification
 *
 */
export interface Notification {
  id: string;
  userId: string;
  executorId: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model BleeterPost
 *
 */
export interface BleeterPost {
  id: string;
  userId: string;
  title: string;
  body: string | null;
  bodyData: DescriptionData | null;
  imageId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model TowCall
 *
 */
export interface TowCall {
  id: string;
  userId: string | null;
  assignedUnitId: string | null;
  assignedUnit: Citizen | null;
  location: string;
  postal: string | null;
  deliveryAddressId: string | null;
  plate: string | null;
  model: string | null;
  description: string | null;
  descriptionData: DescriptionData | null;
  creatorId: string | null;
  creator: Citizen | null;
  ended: boolean;
  callCountyService: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model TaxiCall
 *
 */
export interface TaxiCall {
  id: string;
  userId: string | null;
  assignedUnitId: string | null;
  assignedUnit: Citizen | null;
  location: string;
  postal: string | null;
  description: string | null;
  descriptionData: DescriptionData | null;
  creatorId: string | null;
  creator: Citizen | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model Business
 *
 */
export interface Business {
  id: string;
  userId: string;
  citizenId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  whitelisted: boolean;
  address: string;
  postal: string | null;
  status: WhitelistStatus | null;
}

/**
 * Model Employee
 *
 */
export interface Employee {
  id: string;
  userId: string;
  citizenId: string;
  businessId: string;
  roleId: string | null;
  employeeOfTheMonth: boolean;
  canCreatePosts: boolean;
  whitelistStatus: WhitelistStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model BusinessPost
 *
 */
export interface BusinessPost {
  id: string;
  userId: string;
  employeeId: string;
  businessId: string;
  title: string;
  body: string | null;
  bodyData: DescriptionData | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model EmployeeValue
 *
 */
export interface EmployeeValue {
  id: string;
  valueId: string;
  value: Value<ValueType.BUSINESS_ROLE>;
  as: EmployeeAsEnum;
}

/**
 * Model Officer
 *
 */
export interface Officer {
  id: string;
  departmentId: string | null;
  department: DepartmentValue;
  callsign: string;
  callsign2: string;
  divisions: DivisionValue[];
  rankId: string | null;
  rank: Value<ValueType.OFFICER_RANK> | null;
  statusId: string | null;
  status: StatusValue | null;
  suspended: boolean;
  badgeNumber: number | null;
  imageId: string | null;
  citizenId: string;
  citizen: Citizen;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  whitelistStatusId: string | null;
  combinedLeoUnitId: string | null;
}

/**
 * Model LeoWhitelistStatus
 *
 */
export interface LeoWhitelistStatus {
  id: string;
  status: WhitelistStatus;
  departmentId: string;
  department: DepartmentValue;
}

/**
 * Model StatusValue
 *
 */
export interface StatusValue {
  id: string;
  valueId: string;
  value: Value<ValueType.CODES_10>;
  shouldDo: ShouldDoType;
  whatPages: WhatPages[];
  color: string | null;
  type: StatusValueType;
}

/**
 * Model OfficerLog
 *
 */
export interface OfficerLog {
  id: string;
  startedAt: Date;
  endedAt: Date | null;
  userId: string | null;
  officerId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model ImpoundedVehicle
 *
 */
export interface ImpoundedVehicle {
  id: string;
  registeredVehicleId: string;
  vehicle: RegisteredVehicle;
  valueId: string;
  location: Value<ValueType.IMPOUND_LOT>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model LeoIncident
 *
 */
export interface LeoIncident {
  id: string;
  caseNumber: number;
  description: string | null;
  descriptionData: DescriptionData | null;
  creatorId: string;
  firearmsInvolved: boolean;
  injuriesOrFatalities: boolean;
  arrestsMade: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model CombinedLeoUnit
 *
 */
export interface CombinedLeoUnit {
  id: string;
  callsign: string;
  statusId: string | null;
  status: StatusValue | null;
  officers: Officer[];
}

/**
 * Model ActiveDispatchers
 *
 */
export interface ActiveDispatchers {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

/**
 * Model Call911
 *
 */
export interface Call911 {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  positionId: string | null;
  position: Position | null;
  userId: string | null;
  location: string;
  postal: string | null;
  description: string | null;
  descriptionData: DescriptionData | null;
  name: string;
  ended: boolean | null;
  departments?: DepartmentValue[];
  divisions?: DivisionValue[];
}

/**
 * Model Position
 *
 */
export interface Position {
  id: string;
  lat: number | null;
  lng: number | null;
}

/**
 * Model AssignedUnit
 *
 */
export interface AssignedUnit {
  id: string;
  officerId: string | null;
  emsFdDeputyId: string | null;
  combinedLeoId: string | null;
  call911Id: string | null;
  createdAt: Date;
  updatedAt: Date;
  unit: Officer | CombinedLeoUnit | EmsFdDeputy;
}

/**
 * Model Call911Event
 *
 */
export interface Call911Event {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  call911Id: string;
  description: string;
}

/**
 * Model Bolo
 *
 */
export interface Bolo {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  type: BoloType;
  description: string | null;
  plate: string | null;
  model: string | null;
  color: string | null;
  name: string | null;
  officerId: string | null;
}

/**
 * Model Record
 *
 */
export interface Record {
  id: string;
  type: RecordType;
  citizenId: string;
  officerId: string;
  officer: Officer;
  createdAt: Date;
  updatedAt: Date;
  postal: string;
  notes: string | null;
  releaseId: string | null;
  expungementRequestId: string | null;
  violations: Violation[];
}

/**
 * Model RecordRelease
 *
 */
export interface RecordRelease {
  id: string;
  type: ReleaseType;
  citizenId: string | null;
  releasedBy: Citizen | null;
}

/**
 * Model Warrant
 *
 */
export interface Warrant {
  id: string;
  citizenId: string;
  officerId: string;
  officer?: Officer;
  description: string;
  status: WarrantStatus;
  createdAt: Date;
  updatedAt: Date;
  expungementRequestId: string | null;
}

/**
 * Model RecordLog
 *
 */
export interface RecordLog {
  id: string;
  citizenId: string;
  recordId: string | null;
  records: Record | null;
  warrantId: string | null;
  warrant: Warrant | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model ExpungementRequest
 *
 */
export interface ExpungementRequest {
  id: string;
  citizenId: string;
  userId: string | null;
  status: ExpungementRequestStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model EmsFdDeputy
 *
 */
export interface EmsFdDeputy {
  id: string;
  departmentId: string;
  department: DepartmentValue;
  callsign: string;
  callsign2: string;
  divisionId: string;
  division: DivisionValue;
  rankId: string | null;
  rank: Value<ValueType.OFFICER_RANK> | null;
  statusId: string | null;
  status: StatusValue | null;
  suspended: boolean;
  badgeNumber: number | null;
  imageId: string | null;
  citizenId: string;
  citizen: Citizen;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Model TruckLog
 *
 */
export interface TruckLog {
  id: string;
  citizenId: string | null;
  userId: string;
  vehicleId: string | null;
  startedAt: string;
  endedAt: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Enums
 */

// Based on
// https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

export enum Feature {
  BLEETER = "BLEETER",
  TOW = "TOW",
  TAXI = "TAXI",
  COURTHOUSE = "COURTHOUSE",
  TRUCK_LOGS = "TRUCK_LOGS",
  AOP = "AOP",
  BUSINESS = "BUSINESS",
  ALLOW_DUPLICATE_CITIZEN_NAMES = "ALLOW_DUPLICATE_CITIZEN_NAMES",
  DISCORD_AUTH = "DISCORD_AUTH",
  CALLS_911 = "CALLS_911",
  WEAPON_REGISTRATION = "WEAPON_REGISTRATION",
  SOCIAL_SECURITY_NUMBERS = "SOCIAL_SECURITY_NUMBERS",
  DISALLOW_TEXTFIELD_SELECTION = "DISALLOW_TEXTFIELD_SELECTION",
  ACTIVE_DISPATCHERS = "ACTIVE_DISPATCHERS",
}

export enum Rank {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  USER = "USER",
}

export enum WhitelistStatus {
  ACCEPTED = "ACCEPTED",
  PENDING = "PENDING",
  DECLINED = "DECLINED",
}

export enum StatusViewMode {
  FULL_ROW_COLOR = "FULL_ROW_COLOR",
  DOT_COLOR = "DOT_COLOR",
}

export enum TableActionsAlignment {
  NONE = "NONE",
  LEFT = "LEFT",
  RIGHT = "RIGHT",
}

export enum ValueType {
  LICENSE = "LICENSE",
  GENDER = "GENDER",
  ETHNICITY = "ETHNICITY",
  VEHICLE = "VEHICLE",
  WEAPON = "WEAPON",
  BLOOD_GROUP = "BLOOD_GROUP",
  BUSINESS_ROLE = "BUSINESS_ROLE",
  CODES_10 = "CODES_10",
  PENAL_CODE = "PENAL_CODE",
  DEPARTMENT = "DEPARTMENT",
  OFFICER_RANK = "OFFICER_RANK",
  DIVISION = "DIVISION",
  DRIVERSLICENSE_CATEGORY = "DRIVERSLICENSE_CATEGORY",
  IMPOUND_LOT = "IMPOUND_LOT",
}

export enum ValueLicenseType {
  LICENSE = "LICENSE",
  REGISTRATION_STATUS = "REGISTRATION_STATUS",
}

export enum DepartmentType {
  LEO = "LEO",
  EMS_FD = "EMS_FD",
}

export enum DriversLicenseCategoryType {
  AUTOMOTIVE = "AUTOMOTIVE",
  AVIATION = "AVIATION",
  WATER = "WATER",
}

export enum EmployeeAsEnum {
  OWNER = "OWNER",
  MANAGER = "MANAGER",
  EMPLOYEE = "EMPLOYEE",
}

export enum ShouldDoType {
  SET_OFF_DUTY = "SET_OFF_DUTY",
  SET_ON_DUTY = "SET_ON_DUTY",
  SET_ASSIGNED = "SET_ASSIGNED",
  SET_STATUS = "SET_STATUS",
  PANIC_BUTTON = "PANIC_BUTTON",
}

export enum StatusValueType {
  STATUS_CODE = "STATUS_CODE",
  SITUATION_CODE = "SITUATION_CODE",
}

export enum WhatPages {
  DISPATCH = "DISPATCH",
  EMS_FD = "EMS_FD",
  LEO = "LEO",
}

export enum BoloType {
  VEHICLE = "VEHICLE",
  PERSON = "PERSON",
  OTHER = "OTHER",
}

export enum RecordType {
  ARREST_REPORT = "ARREST_REPORT",
  TICKET = "TICKET",
  WRITTEN_WARNING = "WRITTEN_WARNING",
}

export enum ReleaseType {
  TIME_OUT = "TIME_OUT",
  BAIL_POSTED = "BAIL_POSTED",
}

export enum ExpungementRequestStatus {
  ACCEPTED = "ACCEPTED",
  DENIED = "DENIED",
  PENDING = "PENDING",
}

export enum WarrantStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}
