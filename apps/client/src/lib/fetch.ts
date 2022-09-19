import axios, { type Method, type AxiosRequestConfig, type AxiosResponse } from "axios";
import type { IncomingMessage } from "connect";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";
import { getAPIUrl } from "./fetch/getAPIUrl";
import { getErrorObj } from "./useFetch";

export type RequestData = Record<string, unknown>;

interface Options extends Omit<AxiosRequestConfig, "headers"> {
  headers?: any;
  req?: IncomingMessage & { cookies?: NextApiRequestCookies };
  method?: Method | string;
  data?: RequestData;
  isSsr?: boolean;
  throwBadRequest?: boolean;
}

export async function handleRequest<T = any>(
  path: string,
  options?: Options,
): Promise<AxiosResponse<T, T>> {
  const { req, method, data } = options ?? {};

  const apiUrl = getAPIUrl();
  const location = typeof window !== "undefined" ? window.location : null;
  const isDispatchUrl = ["/dispatch", "/dispatch/map"].includes(
    String(location?.pathname ?? req?.url),
  );
  const parsedCookie = req?.headers.cookie;

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
    if (options?.throwBadRequest) {
      throw e;
    }

    return makeReturn(e);
  }
}

function makeReturn<T>(v: any): Omit<AxiosResponse<T>, "request"> {
  const errorObj = getErrorObj(v);

  return {
    data: v.data,
    status: v.status,
    statusText: v.statusText,
    headers: v.headers,
    config: v.config,
    ...errorObj,
  };
}
