import axios, { AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";
import { IncomingMessage } from "connect";
export type RequestData = Record<string, unknown>;
export type AllowedMethods = "PATCH" | "PUT" | "DELETE" | "OPTIONS" | "GET" | "POST";

interface Options extends AxiosRequestConfig {
  headers?: any;
  req?: Pick<IncomingMessage, "url">;
  method?: AllowedMethods;
  data?: RequestData;
}

export function handleRequest<T = any>(
  path: string,
  { req, ...rest }: Options = {},
): Promise<AxiosResponse<T>> {
  const url = findUrl();
  const location = typeof window !== "undefined" ? window.location : null;
  const isDispatchUrl = location?.pathname ?? req?.url;

  let host;
  try {
    const origin = process.env.CORS_ORIGIN_URL ?? "http://localhost:3000";
    const url = new URL(origin);
    host = `${url.hostname}:${url.port}`;
  } catch (e) {
    if (e) {
      console.log("DEBUG", e);
    }

    host = rest.headers.host;
  }

  return axios({
    url: `${url}${path}`,
    method: rest?.method ?? "GET",
    data: rest?.data,
    withCredentials: true,
    ...rest,
    headers: {
      ...(rest?.headers ?? {}),
      "Content-Type": "application/json",
      "is-from-dispatch": isDispatchUrl === "/dispatch",
      host,
    },
  }) as AxiosPromise<T>;
}

export function findUrl() {
  const envUrl = process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080/v1";
  const includesDockerContainerName = envUrl === "http://api:8080/v1";

  if ((process.browser || typeof window !== "undefined") && includesDockerContainerName) {
    return "http://localhost:8080/v1";
  }

  return envUrl;
}
