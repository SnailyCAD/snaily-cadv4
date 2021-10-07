export enum Cookie {
  Session = "snaily-cad-session",
}

// TODO: move to `@snailycad/config`
export const allowedFileExtensions = [
  "image/png",
  "image/gif",
  "image/jpeg",
  "image/svg+xml",
] as const;
