import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { serialize } from "cookie";
import { IncomingMessage } from "connect";
import { NextApiRequestCookies } from "next/dist/server/api-utils";

export type RequestData = Record<string, unknown>;
export type AllowedMethods = "PATCH" | "PUT" | "DELETE" | "OPTIONS" | "GET" | "POST";

interface Options extends Omit<AxiosRequestConfig<any>, "headers"> {
  headers?: any;
  req?: Pick<IncomingMessage, "url" | "headers"> & { cookies?: NextApiRequestCookies };
  method?: AllowedMethods;
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
  let parsedCookie = req?.headers.cookie;

  if (process.env.DEBUG_REQUESTS === "true") {
    console.log("COOKIES", req?.cookies);
    console.log("REQUEST", req);
    console.log("COOKIE", { COOKIE: cookie });

    if (!parsedCookie) {
      parsedCookie = serialize("snaily-cad-session", cookie as string, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 60 * 60 * 1000 * 5),
      });
    }
  }

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

  if (process.env.DEBUG_REQUESTS === "true") {
    console.log("COOKIES", res);
  }

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
