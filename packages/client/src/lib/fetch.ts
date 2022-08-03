import axios, { type Method, type AxiosRequestConfig, type AxiosResponse } from "axios";
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
): Promise<AxiosResponse<T, T>> {
  const { req, method, data } = options ?? {};

  const apiUrl = findAPIUrl();
  const location = typeof window !== "undefined" ? window.location : null;
  const isDispatchUrl = (location?.pathname ?? req?.url) === "/dispatch";
  let parsedCookie = req?.headers.cookie;
  const cookies = nookies.get({ req });

  if (process.env.IFRAME_SUPPORT_ENABLED === "true" && !parsedCookie) {
    parsedCookie = cookies[IFRAME_COOKIE_NAME]!;
  }

  try {
    const res = await axios({
      url: `${apiUrl}${path}`,
      method,
      data: data ?? undefined,
      withCredentials: true,
      params: options?.params,
      headers: {
        Session: parsedCookie ?? "",
        "Content-Type": "application/json",
        "is-from-dispatch": String(isDispatchUrl),
      },
    });

    return makeReturn(res);
  } catch (e) {
    return makeReturn(e);
  }
}

export function findAPIUrl() {
  const envUrl = process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080/v1";

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:8080/v1";
  }

  return envUrl;
}

function makeReturn<T>(v: any): Omit<AxiosResponse<T>, "request"> {
  delete v.request;

  return v;
}
