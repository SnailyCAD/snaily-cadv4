import type { User } from "@prisma/client";
import { hasPermission, Permissions } from "@snailycad/permissions";
import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
  UseGuards,
} from "@nestjs/common";
import { FastifyRequest } from "fastify";
import { Reflector } from "@nestjs/core";

interface RouteData {
  permissions: Permissions[];
}

@Injectable()
export class UsePermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const routeDataOrFunc = this.reflector.get<UsePermissionsFunc | RouteData | undefined>(
      "permissions",
      context.getHandler(),
    );

    // todo(FastifyRequest): custom request
    const request = context.switchToHttp().getRequest<FastifyRequest & { user: User | null }>();

    console.log(routeDataOrFunc);

    if (!routeDataOrFunc) {
      return true;
    }

    if (!request.user) {
      return false;
      // throw new Unauthorized("Unauthorized (UsePermissions)");
    }

    const routeData =
      typeof routeDataOrFunc === "function" ? routeDataOrFunc(request) : routeDataOrFunc;

    const hasPerm = hasPermission({
      userToCheck: request.user,
      permissionsToCheck: routeData.permissions,
    });

    if (!hasPerm) {
      // throw new Forbidden("Invalid permissions (UsePermissions)");
      return false;
    }

    return true;
  }
}

export type UsePermissionsFunc = (request: FastifyRequest) => RouteData;
export function UsePermissions(permissions: UsePermissionsFunc | RouteData) {
  return applyDecorators(SetMetadata("permissions", permissions), UseGuards(UsePermissionsGuard));
}

export { Permissions };
