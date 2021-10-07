/**
 * Model cad
 */

export type cad = {
  id: string;
  name: string;
  ownerId: string;
  areaOfPlay: string | null;
  steamApiKey: string | null;
  whitelisted: boolean;
  towWhitelisted: boolean;
};

/**
 * Model User
 */

export type User = {
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
 * Enums
 */

// Based on
// https://github.com/microsoft/TypeScript/issues/3192#issuecomment-261720275

export const Rank = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MODERATOR: "MODERATOR",
  USER: "USER",
};

export type Rank = typeof Rank[keyof typeof Rank];

export const WhitelistStatus = {
  ACCEPTED: "ACCEPTED",
  PENDING: "PENDING",
  DECLINED: "DECLINED",
};

export type WhitelistStatus = typeof WhitelistStatus[keyof typeof WhitelistStatus];
