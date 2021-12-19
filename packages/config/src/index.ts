export enum Cookie {
  Session = "snaily-cad-session",
}

export const API_TOKEN_HEADER = "snaily-cad-api-token" as const;
export type AllowedFileExtension = typeof allowedFileExtensions[number];
export const allowedFileExtensions = ["image/png", "image/gif", "image/jpeg", "image/jpg"] as const;

export * from "./socket-events";
export * from "./routes";
