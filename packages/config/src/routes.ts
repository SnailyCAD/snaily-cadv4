import type { User as _User } from "@snailycad/types";
export type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * `*` = all methods
 */
export type DisabledRoute = [string, Method[] | "*"];

export const DISABLED_API_TOKEN_ROUTES: DisabledRoute[] = [
  ["/v1/user", "*"],
  ["/v1/admin/manage/cad-settings", "*"],
];

type Rank = "ADMIN" | "OWNER" | "USER";
type UserPicks = "isLeo" | "isDispatch" | "isEmsFd" | "isSupervisor" | "isTaxi" | "isTow";
type User = Pick<_User, UserPicks> & { rank: Rank };

type Route = string | RegExp | { strict: true; route: string | RegExp };
export type PermissionRoute = [Method[] | "*", Route, (user: User) => boolean];

export const PERMISSION_ROUTES: PermissionRoute[] = [
  ["*", /\/v1\/admin\/manage\/cad-settings/, (u) => u.rank === "OWNER"],
  [["GET", "POST"], { strict: true, route: "/v1/911-calls" }, () => true],
  [["PUT", "DELETE", "POST"], "/v1/911-calls/events", (u) => u.isDispatch],
  [["POST"], "/v1/911-calls/assign-to/", (u) => u.isLeo || u.isEmsFd],
  [["PUT", "DELETE"], "/v1/911-calls", (u) => u.isDispatch],
];
