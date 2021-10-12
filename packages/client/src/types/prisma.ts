/* eslint-disable capitalized-comments */
/**
 * Model cad
 */

export type cad = {
  id: string;
  name: string;
  ownerId: string;
  areaOfPlay: string | null;
  steamApiKey: string | null;
  registrationCode: string | null;
  whitelisted: boolean;
  towWhitelisted: boolean;
  disabledFeatures: Feature[];
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
  model: Value<"VEHICLE">;
  color: string;
  createdAt: Date;
  registrationStatus: Value<"LICENSE">;
  registrationStatusId: string;
  insuranceStatus: string;
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
  model: Value<"VEHICLE">;
  modelId: string;
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
};

/**
 * Model Value
 */

export type Value<Type extends ValueType = ValueType> = {
  id: string;
  type: Type;
  value: string;
  isDefault: boolean;
};

/**
 * Model BleeterPost
 */

export type BleeterPost = {
  id: string;
  userId: string;
  title: string;
  body: string;
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
  description: string;
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
  createdAt: Date;
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
};

/**
 * Enums
 */

// Based on
// https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

export const rank = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
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
} as const;

export type ValueType = typeof valueType[keyof typeof valueType];

export const feature = {
  BLEETER: "BLEETER",
  TOW: "TOW",
  TAXI: "TAXI",
  COURTHOUSE: "COURTHOUSE",
  TRUCK_LOGS: "TRUCK_LOGS",
  AOP: "AOP",
} as const;

export type Feature = typeof feature[keyof typeof feature];
