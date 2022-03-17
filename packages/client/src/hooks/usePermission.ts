import { Permissions, hasPermission, getPermissions } from "@snailycad/permissions";
import type { User } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

type Fallback = (user: User) => boolean;
export { Permissions };
export function usePermission() {
  const { user } = useAuth();

  function _hasPermission(permissionsToCheck: Permissions[], fallback: Fallback | boolean) {
    if (!user) return false;
    if (!user.permissions) {
      return typeof fallback === "boolean" ? fallback : fallback(user);
    }

    return hasPermission(user.permissions, permissionsToCheck);
  }

  function _getPermissions() {
    if (!user) return false;
    // todo: add default permissions?
    return getPermissions(user.permissions ?? []);
  }

  return { hasPermissions: _hasPermission, getPermissions: _getPermissions };
}
