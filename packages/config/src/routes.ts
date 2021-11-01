export type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * `*` = all methods
 */
export type DisabledRoute = [string, Method[] | "*"];

export const DISABLED_API_TOKEN_ROUTES: DisabledRoute[] = [
  ["/v1/user", "*"],
  ["/v1/admin/manage/cad-settings", "*"],
  ["/v1/admin/manage/", ["POST", "DELETE", "PUT", "PATCH"]],
  ["/v1/admin/values", ["POST", "DELETE", "PUT", "PATCH"]],
  ["/v1/citizen", ["POST", "DELETE", "PUT", "PATCH"]],
  // todo: add other routes
];

type _User = {
  rank: "OWNER" | "USER" | "ADMIN";
  isLeo: boolean;
  isDispatch: boolean;
  isEmsFd: boolean;
  isSupervisor: boolean;
};
export type PermissionRoute = [Method[] | "*", string | RegExp, (user: _User) => boolean];

export const PERMISSION_ROUTES: PermissionRoute[] = [
  [
    ["PUT"],
    // /v1/leo/:officerId/status
    /\/v1\/(leo|ems-fd)\/[A-Z0-9]+\/status/i,
    (u) => u.isLeo || u.isSupervisor || u.isDispatch || u.isEmsFd,
  ],
  [["GET"], /\/v1\/leo\/active-(officers|officer)/, (u) => u.isLeo || u.isDispatch],
  ["*", "/v1/leo", (u) => u.isLeo],

  [["POST"], "/v1/search/name", (u) => u.isLeo || u.isDispatch],
  [["POST"], "/v1/search/weapon", (u) => u.isLeo || u.isDispatch],
  [["POST"], "/v1/search/vehicle", (u) => u.isLeo || u.isDispatch],

  [["GET"], /\/v1\/ems-fd\/active-(deputies|deputy)/, (u) => u.isEmsFd || u.isDispatch],
  ["*", "/v1/ems-fd", (u) => u.isEmsFd],

  [["POST"], "/v1/search/medical-records", (u) => u.isEmsFd],

  [["GET"], "/v1/bolos", (u) => u.isLeo || u.isDispatch || u.isEmsFd],
  [["POST", "PUT", "DELETE"], "/v1/bolos", (u) => u.isLeo || u.isDispatch],

  ["*", "/v1/admin/manage/cad-settings", (u) => ["OWNER"].includes(u.rank)],
  [
    ["GET", "PATCH", "DELETE", "PUT", "POST"],
    "/v1/admin/manage/units",
    (u) => u.isSupervisor || ["ADMIN", "OWNER"].includes(u.rank),
  ],
  [
    ["GET", "PATCH", "DELETE", "PUT", "POST"],
    "/v1/admin/manage/",
    (u) => ["ADMIN", "OWNER"].includes(u.rank),
  ],
  [
    ["PATCH", "DELETE", "PUT", "POST"],
    "/v1/admin/values/",
    (u) => ["ADMIN", "OWNER"].includes(u.rank),
  ],
  [["PUT", "DELETE", "POST"], "/v1/911-calls/events", (u) => u.isDispatch],
  [["POST"], "/v1/911-calls/assign-to/", (u) => u.isLeo || u.isEmsFd],
  [["PUT", "DELETE"], "/v1/911-calls", (u) => u.isDispatch],
  ["*", "/v1/dispatch", (u) => u.isDispatch],
  ["*", "/v1/search/address", (u) => u.isDispatch],
];
