import { allPermissions, type Permissions } from "./permissions";

export * from "./permissions";
export function hasPermission(
  userPermissions: readonly (string | Permissions)[],
  toCheck: readonly Permissions[],
) {
  const invalids = [];

  for (const perm of toCheck) {
    if (!userPermissions.includes(perm)) {
      invalids.push(perm);
      continue;
    }
  }

  return invalids.length !== toCheck.length;
}

export type PermissionNames = keyof typeof Permissions;
export function getPermissions(
  userPermissions: readonly (string | Permissions)[],
): Record<PermissionNames, boolean> {
  const permissions: Record<string, boolean> = {};

  allPermissions.forEach((name) => {
    permissions[name] = hasPermission(userPermissions, [name as Permissions]);
  });

  return permissions;
}
