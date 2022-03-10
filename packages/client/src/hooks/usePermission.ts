import { Permissions, hasPermission } from "@snailycad/permissions";
import { useAuth } from "context/AuthContext";

export function usePermission() {
  const { user } = useAuth();

  function _hasPermission(permissionsToCheck: Permissions[]) {
    if (!user) return false;
    // todo: add default permissions?
    return hasPermission(user.permissions ?? 0, permissionsToCheck);
  }

  return _hasPermission;
}
