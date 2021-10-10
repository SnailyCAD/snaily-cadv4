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
  gender: string;
  ethnicity: string;
  hairColor: string;
  eyeColor: string;
  address: string;
  height: string;
  weight: string;
  driversLicense: string | null;
  weaponLicense: string | null;
  pilotLicense: string | null;
  ccw: string | null;
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
  model: string;
  color: string;
  createdAt: Date;
  registrationStatus: string;
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
  registrationStatus: string;
  model: string;
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

export type Value = {
  id: string;
  type: ValueType;
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
} as const;

export type ValueType = typeof valueType[keyof typeof valueType];
