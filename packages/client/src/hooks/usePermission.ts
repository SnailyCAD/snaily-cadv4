import { Permissions, allPermissions, hasPermission, getPermissions } from "@snailycad/permissions";
import { type User, Rank } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

export type PermissionsFallback = (user: User) => boolean;
export { Permissions };
export function usePermission() {
  const { user } = useAuth();

  function _hasPermission(
    permissionsToCheck: Permissions[],
    fallback: PermissionsFallback | boolean,
    userToCheck: User | null = user,
  ) {
    if (!userToCheck) return false;
    if (userToCheck.roles && userToCheck.roles.length >= 1) {
      userToCheck.permissions = userToCheck.roles.flatMap((r) => r.permissions);
    }

    if (userToCheck.rank === Rank.OWNER) {
      userToCheck.permissions = allPermissions;
    }

    if (!userToCheck.permissions?.length) {
      return typeof fallback === "boolean" ? fallback : fallback(userToCheck);
    }

    return hasPermission(userToCheck.permissions, permissionsToCheck);
  }

  function _getPermissions(userToCheck: User | null = user) {
    if (!userToCheck) return false;

    if (userToCheck.roles && userToCheck.roles.length >= 1) {
      userToCheck.permissions = userToCheck.roles.flatMap((r) => r.permissions);
    }

    return getPermissions(userToCheck.permissions ?? []);
  }

  return { hasPermissions: _hasPermission, getPermissions: _getPermissions };
}
