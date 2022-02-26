import type { User as _User } from "@snailycad/types";
export type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * `*` = all methods
 */
export type DisabledRoute = [string, Method[] | "*"];

export const DISABLED_API_TOKEN_ROUTES: DisabledRoute[] = [
  ["/v1/user", "*"],
  ["/v1/admin/manage/cad-settings", "*"],
  ["/v1/admin/manage/users", ["POST", "DELETE", "PUT", "PATCH"]],
];

type Rank = "ADMIN" | "OWNER" | "USER";
type UserPicks = "isLeo" | "isDispatch" | "isEmsFd" | "isSupervisor" | "isTaxi" | "isTow";
type User = Pick<_User, UserPicks> & { rank: Rank };

type Route = string | RegExp | { strict: true; route: string | RegExp };
export type PermissionRoute = [Method[] | "*", Route, (user: User) => boolean];

export const PERMISSION_ROUTES: PermissionRoute[] = [
  [["POST"], "/v1/dispatch/status/merge", (u) => u.isLeo],
  [["POST"], "/v1/dispatch/status/unmerge", (u) => u.isDispatch || u.isLeo],
  [
    "*",
    /\/v1\/dispatch\/status\/\w+/i,
    (u) => u.isLeo || u.isSupervisor || u.isDispatch || u.isEmsFd,
  ],
  [
    ["GET"],
    /\/v1\/(leo|ems-fd)\/active-(officers|officer|deputies|deputy)/,
    (u) => u.isLeo || u.isDispatch || u.isEmsFd,
  ],
  ["*", "/v1/leo", (u) => u.isLeo],

  [["POST", "PUT"], "/v1/incidents", (u) => u.isLeo || u.isDispatch],
  [["DELETE"], "/v1/incidents", (u) => u.isSupervisor],
  ["*", "/v1/incidents", (u) => u.isLeo || u.rank !== "USER"],

  [["POST"], "/v1/search/name", (u) => u.isLeo || u.isDispatch],
  [["POST"], "/v1/search/weapon", (u) => u.isLeo || u.isDispatch],
  [["POST"], "/v1/search/vehicle", (u) => u.isLeo || u.isDispatch],

  [["GET"], /\/v1\/ems-fd\/active-(deputies|deputy)/, (u) => u.isEmsFd || u.isDispatch],
  ["*", "/v1/ems-fd", (u) => u.isEmsFd],

  [["POST"], "/v1/search/medical-records", (u) => u.isEmsFd],

  [["GET"], "/v1/bolos", (u) => u.isLeo || u.isDispatch || u.isEmsFd],
  [["POST", "PUT", "DELETE"], "/v1/bolos", (u) => u.isLeo || u.isDispatch],

  ["*", /\/v1\/admin\/manage\/cad-settings/, (u) => u.rank === "OWNER"],
  [["GET"], "/v1/admin/values", () => true],
  [
    ["GET"],
    "/v1/admin/manage/citizens/records-logs",
    (u) => u.isSupervisor || ["ADMIN", "OWNER"].includes(u.rank),
  ],
  ["*", "/v1/admin/manage/units", (u) => u.isSupervisor || ["ADMIN", "OWNER"].includes(u.rank)],
  [
    ["PATCH", "DELETE", "PUT", "POST"],
    "/v1/admin/values/",
    (u) => ["ADMIN", "OWNER"].includes(u.rank),
  ],
  ["*", "/v1/admin", (u) => ["ADMIN", "OWNER"].includes(u.rank)],
  [["GET", "POST"], { strict: true, route: "/v1/911-calls" }, () => true],
  [["PUT", "DELETE", "POST"], "/v1/911-calls/events", (u) => u.isDispatch],
  [["POST"], "/v1/911-calls/assign-to/", (u) => u.isLeo || u.isEmsFd],
  [["PUT", "DELETE"], "/v1/911-calls", (u) => u.isDispatch],
  ["*", "/v1/dispatch", (u) => u.isDispatch || u.isLeo || u.isEmsFd],
  ["*", "/v1/search/address", (u) => u.isDispatch],

  [["DELETE", "PUT", "PATCH"], "/v1/tow", (u) => u.isTow],
  [["DELETE", "PUT", "PATCH"], "/v1/taxi", (u) => u.isTaxi],

  ["*", "/v1/records", (u) => u.isLeo],
];
