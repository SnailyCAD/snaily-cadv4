import { Permissions, hasPermission, getPermissions, PartialUser } from "@snailycad/permissions";
import type { User } from "@snailycad/types";
import { useAuth } from "context/AuthContext";

export type PermissionsFallback = (user: PartialUser) => boolean | undefined;
export { Permissions };
export function usePermission() {
  const { user } = useAuth();

  function _hasPermission(
    permissionsToCheck: Permissions[],
    fallback?: PermissionsFallback | boolean,
    userToCheck: User | null = user,
  ) {
    if (!userToCheck) return false;

    return hasPermission({
      permissionsToCheck,
      userToCheck,
      fallback,
    });
  }

  function _getPermissions(userToCheck: User | null = user) {
    if (!userToCheck) return false;

    return getPermissions(userToCheck);
  }

  return { hasPermissions: _hasPermission, getPermissions: _getPermissions };
}
