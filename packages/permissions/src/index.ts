import * as defaultPermissions from "./defaults";
import { allPermissions, type Permissions } from "./permissions";

export * from "./permissions";

/**
 * checks whether a user has certain permissions.
 * @param userPermissions - An array of permissions that the user has.
 * @param toCheck - The permissions you want to check for.
 * @returns whether a user has certain permissions.
 */
export function hasPermission(
  userPermissions: readonly (string | Permissions)[],
  toCheck: readonly Permissions[],
) {
  if (userPermissions.length <= 0) {
    return false;
  }

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

/**
 * given a list of permissions, return a dictionary of permissions
 * @param userPermissions - An array of permissions that the user has.
 * @returns A dictionary of permissions.
 */
export function getPermissions(
  userPermissions: readonly (string | Permissions)[],
): Record<PermissionNames, boolean> {
  const permissions: Record<string, boolean> = {};

  allPermissions.forEach((name) => {
    permissions[name] = hasPermission(userPermissions, [name as Permissions]);
  });

  return permissions;
}

export { defaultPermissions };
