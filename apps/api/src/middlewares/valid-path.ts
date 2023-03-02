import { PathParams, QueryParams, Middleware, MiddlewareMethods, Next } from "@tsed/common";
import { BadRequest } from "@tsed/exceptions";

// penal_code_group is only allowed for /position
export const validValuePaths = [
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
  "call_type",
  "address",
  "emergency_vehicle",
  "address_flag",
  "vehicle_trim_level",
];

@Middleware()
export class IsValidPath implements MiddlewareMethods {
  use(
    @PathParams("path") path: string,
    @QueryParams("paths") rawPaths: string,
    @Next() next: Next,
  ) {
    const paths =
      typeof rawPaths === "string" ? [...new Set([path, ...rawPaths.split(",")])] : [path];

    if (path === "all") {
      return next();
    }

    for (const path of paths) {
      if (!validValuePaths.includes(path)) {
        throw new BadRequest(`Invalid Path: ${path}. Valid paths: ${validValuePaths.join(", ")}`);
      }
    }

    next();
  }
}
