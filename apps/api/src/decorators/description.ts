import { applyDecorators } from "@nestjs/common";
import { ApiOperation } from "@nestjs/swagger";

export function Description(description: string) {
  return applyDecorators(ApiOperation({ description }));
}
