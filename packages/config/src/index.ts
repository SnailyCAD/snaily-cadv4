export enum Cookie {
  AccessToken = "snaily-cad-session",
  RefreshToken = "snaily-cad-refresh-token",
}

export const API_TOKEN_HEADER = "snaily-cad-api-token" as const;

/** the header which is used by a user to connect to the API with their token (Not JWT) */
export const USER_API_TOKEN_HEADER = "snaily-cad-user-api-token" as const;

export type AllowedFileExtension = (typeof allowedFileExtensions)[number];
export const allowedFileExtensions = [
  "image/png",
  "image/gif",
  "image/jpeg",
  "image/jpg",
  "image/webp",
] as const;
export const IMAGES_REGEX = /https:\/\/(i.imgur.com|cdn.discordapp.com)\/.+/gi;

export * from "./socket-events";
export * from "./routes";
