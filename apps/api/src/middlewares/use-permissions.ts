import { Middleware, MiddlewareMethods, Context, Next } from "@tsed/common";
import { UseBefore } from "@tsed/platform-middlewares";
import { StoreSet, useDecorators } from "@tsed/core";
import type { User } from "@prisma/client";
import { hasPermission, Permissions } from "@snailycad/permissions";
import { Forbidden, Unauthorized } from "@tsed/exceptions";

interface RouteData {
  permissions: Permissions[];
}

@Middleware()
export class UsePermissionsMiddleware implements MiddlewareMethods {
  use(@Context() ctx: Context, @Next() next: Next) {
    const routeData = ctx.endpoint.get<RouteData>(UsePermissionsMiddleware);

    const user = ctx.get("user") as User | null;
    if (!user) {
      throw new Unauthorized("Unauthorized (UsePermissions)");
    }

    const hasPerm = hasPermission({
      userToCheck: user,
      permissionsToCheck: routeData.permissions,
    });

    if (!hasPerm) {
      throw new Forbidden("Invalid permissions (UsePermissions)");
    }

    next();
  }
}

export function UsePermissions(data: RouteData) {
  return useDecorators(
    StoreSet(UsePermissionsMiddleware, data),
    UseBefore(UsePermissionsMiddleware),
  );
}

export { Permissions };
