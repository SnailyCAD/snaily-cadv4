import { Permissions, hasPermission, getPermissions } from "@snailycad/permissions";
import { useAuth } from "context/AuthContext";

export { Permissions };
export function usePermission() {
  const { user } = useAuth();

  function _hasPermission(permissionsToCheck: Permissions[]) {
    if (!user) return false;
    // todo: add default permissions?
    return hasPermission(user.permissions ?? 0, permissionsToCheck);
  }

  function _getPermissions() {
    if (!user) return false;
    // todo: add default permissions?
    return getPermissions(user.permissions ?? 0);
  }

  return { hasPermissions: _hasPermission, getPermissions: _getPermissions };
}
