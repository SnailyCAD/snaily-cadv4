import { PathParams, QueryParams, Middleware, MiddlewareMethods } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";

// penal_code_group is only allowed for /position
const validPaths = [
  "license",
  "gender",
  "ethnicity",
  "vehicle",
  "weapon",
  "blood_group",
  "business_role",
  "codes_10",
  "penal_code",
  "department",
  "officer_rank",
  "division",
  "driverslicense_category",
  "impound_lot",
  "vehicle_flag",
  "citizen_flag",
  "penal_code_group",
  "qualification",
];

@Middleware()
export class IsValidPath implements MiddlewareMethods {
  use(@PathParams("path") path: string, @QueryParams("paths") rawPaths: string) {
    const paths =
      typeof rawPaths === "string" ? [...new Set([path, ...rawPaths.split(",")])] : [path];

    for (const path of paths) {
      if (!validPaths.includes(path)) {
        throw new BadRequest(`Invalid Path: ${path}. Valid paths: ${validPaths.join(", ")}`);
      }
    }
  }
}
