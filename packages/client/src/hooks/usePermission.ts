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
  ) {
    if (!user) return false;
    if (user.rank === Rank.OWNER) {
      user.permissions = allPermissions;
    }

    if (!user.permissions?.length) {
      return typeof fallback === "boolean" ? fallback : fallback(user);
    }

    return hasPermission(user.permissions, permissionsToCheck);
  }

  function _getPermissions() {
    if (!user) return false;
    return getPermissions(user.permissions ?? []);
  }

  return { hasPermissions: _hasPermission, getPermissions: _getPermissions };
}
