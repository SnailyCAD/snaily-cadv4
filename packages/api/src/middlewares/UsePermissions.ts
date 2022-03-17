import { Middleware, MiddlewareMethods, Context, Req } from "@tsed/common";
import { UseBefore } from "@tsed/platform-middlewares";
import { StoreSet, useDecorators } from "@tsed/core";
import type { User } from "@snailycad/types";
import { hasPermission, Permissions } from "@snailycad/permissions";
import { Forbidden } from "@tsed/exceptions";

interface RouteData {
  permissions: Permissions[];
  fallback?: ((user: User) => boolean) | boolean;
}

@Middleware()
export class UsePermissionsMiddleware implements MiddlewareMethods {
  async use(@Context() ctx: Context, @Req() req: Req) {
    const routeDataOrFunc = ctx.endpoint.get(UsePermissionsMiddleware) as
      | RouteData
      | UsePermissionsFunc;

    const user = ctx.get("user") as User;
    const routeData =
      typeof routeDataOrFunc === "function" ? routeDataOrFunc(req) : routeDataOrFunc;

    const fallback =
      typeof routeData.fallback === "function" ? routeData.fallback(user) : routeData.fallback;

    console.log({ user });
    console.log({ routeData });

    let hasPerm = hasPermission(
      [Permissions.ViewUsers, Permissions.ManageUsers],
      routeData.permissions,
    );

    if (!user.permissions && fallback) {
      hasPerm = fallback;
    }

    if (!hasPerm) {
      throw new Forbidden("Insufficient permissions");
    }
  }
}

type UsePermissionsFunc = (request: Req) => RouteData;
export function UsePermissions(data: RouteData | UsePermissionsFunc) {
  return useDecorators(
    StoreSet(UsePermissionsMiddleware, data),
    UseBefore(UsePermissionsMiddleware),
  );
}

export { Permissions };
