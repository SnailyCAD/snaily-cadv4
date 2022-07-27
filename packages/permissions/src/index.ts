import * as defaultPermissions from "./defaults";
import { allPermissions, type Permissions } from "./permissions";

export * from "./permissions";

export interface PartialUser {
  rank: "OWNER" | "ADMIN" | "USER";
  permissions: (Permissions | string)[];
  roles?: { permissions: (Permissions | string)[] }[];

  isDispatch?: boolean;
  isLeo?: boolean;
  isEmsFd?: boolean;
  isTaxi?: boolean;
  isTow?: boolean;
  isSupervisor?: boolean;
}

export interface HasPermissionOptions {
  /** the user to check the permissions of */
  userToCheck: PartialUser | null;
  /** the permissions you want to check. */
  permissionsToCheck: (Permissions | string)[];
  fallback?: boolean | ((user: PartialUser) => boolean | undefined);
}
/**
 * checks whether a user has certain permissions.
 * @returns whether a user has certain permissions.
 */
export function hasPermission(options: HasPermissionOptions) {
  let userPermissions = options.userToCheck?.permissions ?? [];

  if (!options.userToCheck) return false;
  if (options.userToCheck.roles && options.userToCheck.roles.length >= 1) {
    userPermissions = [
      ...userPermissions,
      ...options.userToCheck.roles.flatMap((r) => r.permissions),
    ];
  }

  if (options.userToCheck.rank === "OWNER") {
    return true;
  }

  if (userPermissions.length <= 0 || !Array.isArray(options.permissionsToCheck)) {
    return false;
  }

  for (const perm of options.permissionsToCheck) {
    if (userPermissions.includes(perm)) return true;
  }

  if (userPermissions.length <= 0 && typeof options.fallback !== "undefined") {
    return typeof options.fallback === "boolean"
      ? options.fallback
      : options.fallback(options.userToCheck) ?? false;
  }

  return false;
}

export type PermissionNames = keyof typeof Permissions;

/**
 * given a list of permissions, return a dictionary of permissions.
 * @param user - The user where you want to get the permissions of.
 * @returns A dictionary of permissions.
 */
export function getPermissions(user: PartialUser): Record<PermissionNames, boolean> {
  const permissions: Record<string, boolean> = {};

  allPermissions.forEach((name) => {
    permissions[name] = hasPermission({
      userToCheck: user,
      permissionsToCheck: [name],
    });
  });

  return permissions;
}

export { defaultPermissions };
