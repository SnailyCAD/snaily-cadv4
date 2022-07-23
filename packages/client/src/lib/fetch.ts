import axios, { type Method, type AxiosRequestConfig, type AxiosResponse } from "axios";
import { serialize } from "cookie";
import type { IncomingMessage } from "connect";
import nookies from "nookies";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";
import { IFRAME_COOKIE_NAME } from "../pages/api/token";

export type RequestData = Record<string, unknown>;

interface Options extends Omit<AxiosRequestConfig, "headers"> {
  headers?: any;
  req?: IncomingMessage & { cookies?: NextApiRequestCookies };
  method?: Method | string;
  data?: RequestData;
  isSsr?: boolean;
}

export async function handleRequest<T = any>(
  path: string,
  options?: Options,
  cookie?: string,
): Promise<AxiosResponse<T>> {
  const start = new Date();

  const { req, method, data } = options ?? {};

  const apiUrl = findAPIUrl();
  const location = typeof window !== "undefined" ? window.location : null;
  const isDispatchUrl = (location?.pathname ?? req?.url) === "/dispatch";
  let parsedCookie = req?.headers.cookie ?? serialize("snaily-cad-session", cookie as string);
  const cookies = nookies.get({ req });

  if (process.env.IFRAME_SUPPORT_ENABLED === "true" && !parsedCookie) {
    parsedCookie = cookies[IFRAME_COOKIE_NAME]!;
  }

  const res = await axios({
    url: `${apiUrl}${path}`,
    method,
    data: data ?? undefined,
    withCredentials: true,
    params: options?.params,
    headers: {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      Session: parsedCookie ?? "",
      "Content-Type": "application/json",
      "is-from-dispatch": String(isDispatchUrl),
    },
  }).catch((e) => e);

  if (res instanceof Error) {
    throw makeReturn(res);
  }

  const end = new Date();
  const duration = end.getTime() - start.getTime();
  console.info(`${method ?? "GET"} ${path} - ${duration}ms`);

  return makeReturn(res) as unknown as AxiosResponse<T>;
}

export function findAPIUrl() {
  const envUrl = process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080/v1";

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8080/v1";
  }

  return envUrl;
}

function makeReturn(v: any) {
  delete v.request;

  return v;
}
