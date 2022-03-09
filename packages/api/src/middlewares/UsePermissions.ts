import { Middleware, MiddlewareMethods, Context } from "@tsed/common";
import { UseBefore } from "@tsed/platform-middlewares";
import { StoreSet, useDecorators } from "@tsed/core";
import type { User } from "@snailycad/types";
import { hasPermission, Permissions } from "@snailycad/permissions";
import { Forbidden } from "@tsed/exceptions";

interface RouteData {
  permissions: Permissions[];
}

@Middleware()
export class UsePermissionsMiddleware implements MiddlewareMethods {
  async use(@Context() ctx: Context) {
    const routeData = ctx.endpoint.get(UsePermissionsMiddleware) as RouteData;
    const user = ctx.get("user") as User;
    console.log({ user });

    console.log({ routeData });

    const hasPerm = hasPermission(
      Permissions.ViewUsers | Permissions.ManageUsers,
      routeData.permissions,
    );
    if (!hasPerm) {
      throw new Forbidden("Insufficient permissions");
    }
  }
}

export function UsePermissions(data: RouteData) {
  return useDecorators(
    StoreSet(UsePermissionsMiddleware, data),
    UseBefore(UsePermissionsMiddleware),
  );
}
