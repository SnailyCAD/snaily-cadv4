import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const SessionUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user;
});

export const SessionUserId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user?.id ?? request.sessionUserId;
});
