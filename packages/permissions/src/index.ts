import { Permissions } from "./permissions";

export * from "./permissions";
export function hasPermission(userPermissions: number, toCheck: readonly Permissions[]) {
  let toCheckTotal = 0;

  for (const p of toCheck) {
    toCheckTotal |= p;
  }

  return !!(toCheckTotal & userPermissions);
}

export function getPermissions(userPermissions: number) {
  const permissions: Record<string, boolean> = {};

  Object.entries(Permissions).forEach(([name, value]) => {
    const n = Number(value);
    if (isNaN(n)) return;

    permissions[name] = hasPermission(userPermissions, [n]);
  });

  return permissions;
}
