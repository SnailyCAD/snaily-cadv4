import { Permissions, hasPermission, getPermissions } from "@snailycad/permissions";
import type { User } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

export { Permissions };
export function usePermission() {
  const { user } = useAuth();

  function _hasPermission(permissionsToCheck: Permissions[], userToCheck: User | null = user) {
    if (!userToCheck) return false;

    return hasPermission({
      permissionsToCheck,
      userToCheck,
    });
  }

  function _getPermissions(userToCheck: User | null = user) {
    if (!userToCheck) return false;

    return getPermissions(userToCheck);
  }

  return { hasPermissions: _hasPermission, getPermissions: _getPermissions };
}
