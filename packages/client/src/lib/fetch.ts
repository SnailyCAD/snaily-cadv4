import axios, { Method, AxiosRequestConfig, AxiosResponse } from "axios";
import { serialize } from "cookie";
import { IncomingMessage } from "connect";
import type { NextApiRequestCookies } from "next/dist/server/api-utils";

export type RequestData = Record<string, unknown>;

interface Options extends Omit<AxiosRequestConfig<any>, "headers"> {
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
  const parsedCookie = req?.headers.cookie || serialize("snaily-cad-session", cookie as string);

  const res = await axios({
    url: `${url}${path}`,
    method,
    data: data ?? undefined,
    withCredentials: true,
    headers: {
      Session: parsedCookie ?? "",
      "Content-Type": "application/json",
      "is-from-dispatch": String(isDispatchUrl),
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
