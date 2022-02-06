import axios, { type Method, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { serialize } from "cookie";
import type { IncomingMessage } from "connect";
import nookies from "nookies";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";
import { IFRAME_COOKIE_NAME } from "src/pages/api/token";

export type RequestData = Record<string, unknown>;

interface Options extends Omit<AxiosRequestConfig, "headers"> {
  headers?: any;
  req?: IncomingMessage & { cookies?: NextApiRequestCookies };
  method?: Method;
  data?: RequestData;
}

export async function handleRequest<T = any>(
  path: string,
  options?: Options,
  cookie?: string,
): Promise<AxiosResponse<T>> {
  const { req, method, data } = options ?? {};

  const url = findUrl();
  const location = typeof window !== "undefined" ? window.location : null;
  const isDispatchUrl = (location?.pathname ?? req?.url) === "/dispatch";
  let parsedCookie = req?.headers.cookie ?? serialize("snaily-cad-session", cookie as string);
  const cookies = nookies.get({ req });

  if (process.env.IFRAME_SUPPORT_ENABLED === "true" && !parsedCookie) {
    parsedCookie = cookies[IFRAME_COOKIE_NAME]!;
  }

  const res = await axios({
    url: `${url}${path}`,
    method,
    data: data ?? undefined,
    withCredentials: true,
    headers: {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      Session: parsedCookie ?? "",
      "Content-Type": "application/json",
      "is-from-dispatch": String(isDispatchUrl),
      "discord-access-token": String(options?.headers?.["discord-access-token"]),
    },
  }).catch((e) => {
    return e;
  });

  return res;
}

export function findUrl() {
  const envUrl = process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080/v1";
  const includesDockerContainerName = envUrl === "http://api:8080/v1";

  if ((process.browser || typeof window !== "undefined") && includesDockerContainerName) {
    return "http://localhost:8080/v1";
  }

  return envUrl;
}
