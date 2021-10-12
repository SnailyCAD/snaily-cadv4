import { PathParams, QueryParams, Middleware, MiddlewareMethods } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";
import { validPaths, ValidPath } from "@snailycad/config";

@Middleware()
export class IsValidPath implements MiddlewareMethods {
  async use(@PathParams("path") path: ValidPath, @QueryParams("paths") rawPaths: string) {
    const paths =
      typeof rawPaths === "string" ? [...new Set([path, ...rawPaths.split(",")])] : [path];

    console.log({ paths });

    for (const path of paths) {
      if (!validPaths.includes(path as ValidPath)) {
        throw new BadRequest(`Invalid Path. Valid paths: ${validPaths.join(", ")}`);
      }
    }
  }
}
