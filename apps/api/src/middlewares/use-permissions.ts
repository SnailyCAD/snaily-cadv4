import { Middleware, type MiddlewareMethods, Context, Req, Next } from "@tsed/common";
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
  use(@Context() ctx: Context, @Req() req: Req, @Next() next: Next) {
    const routeDataOrFunc = ctx.endpoint.get<RouteData | UsePermissionsFunc>(
      UsePermissionsMiddleware,
    );

    const user = ctx.get("user") as User | null;
    if (!user) {
      throw new Unauthorized("Unauthorized (UsePermissions)");
    }

    const routeData =
      typeof routeDataOrFunc === "function" ? routeDataOrFunc(req) : routeDataOrFunc;

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

type UsePermissionsFunc = (request: Req) => RouteData;
export function UsePermissions(data: UsePermissionsFunc | RouteData) {
  return useDecorators(
    StoreSet(UsePermissionsMiddleware, data),
    UseBefore(UsePermissionsMiddleware),
  );
}

export { Permissions };
