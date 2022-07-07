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

interface Route {
  route: string;
}
export type PermissionRoute = [Method[] | "*", Route, (user: User) => boolean];

export const PERMISSION_ROUTES: PermissionRoute[] = [
  [["GET"], { route: "/v1/admin/manage/cad-settings/discord/roles" }, () => true],
  ["*", { route: "/v1/admin/manage/cad-settings" }, (u) => u.rank === "OWNER"],
];
