import { ExecutionContext, createParamDecorator } from "@nestjs/common";

export const Cad = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.cad;
});
