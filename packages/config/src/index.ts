export enum Cookie {
  Session = "snaily-cad-session",
}

export type AllowedFileExtension = typeof allowedFileExtensions[number];
export const allowedFileExtensions = ["image/png", "image/gif", "image/jpeg", "image/jpg"] as const;

export type ValidPath = typeof validPaths[number];
export const validPaths = [
  "gender",
  "ethnicity",
  "license",
  "blood-group",
  "vehicle",
  "weapon",
] as const;
