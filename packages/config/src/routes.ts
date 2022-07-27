export type Method = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * `*` = all methods
 */
export type DisabledRoute = [string, Method[] | "*"];

export const DISABLED_API_TOKEN_ROUTES: DisabledRoute[] = [
  ["/v1/user", "*"],
  ["/v1/admin/manage/cad-settings", "*"],
];
