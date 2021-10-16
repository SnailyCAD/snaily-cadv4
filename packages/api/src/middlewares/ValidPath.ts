import { PathParams, QueryParams, Middleware, MiddlewareMethods } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { ValueType } from ".prisma/client";

const validPaths = Object.keys(ValueType).map((v) => v.toLowerCase());

@Middleware()
export class IsValidPath implements MiddlewareMethods {
  async use(@PathParams("path") path: string, @QueryParams("paths") rawPaths: string) {
    const paths =
      typeof rawPaths === "string" ? [...new Set([path, ...rawPaths.split(",")])] : [path];

    for (const path of paths) {
      if (!validPaths.includes(path)) {
        throw new BadRequest(`Invalid Path. Valid paths: ${validPaths.join(", ")}`);
      }
    }
  }
}
