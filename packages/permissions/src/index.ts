import type { Permissions } from "./permissions";

export * from "./permissions";
export function hasPermission(userPerm: number, toCheck: readonly Permissions[]) {
  let toCheckTotal = 0;

  for (const p of toCheck) {
    toCheckTotal |= p;
  }

  return !!(toCheckTotal & userPerm);
}
