import axios, { AxiosPromise, AxiosRequestConfig, AxiosResponse } from "axios";
import { IncomingMessage } from "connect";

export type RequestData = Record<string, unknown>;
export type AllowedMethods = "PATCH" | "PUT" | "DELETE" | "OPTIONS" | "GET" | "POST";

interface Options extends Omit<AxiosRequestConfig<any>, "headers"> {
  headers?: any;
  req?: Pick<IncomingMessage, "url" | "headers">;
  method?: AllowedMethods;
  data?: RequestData;
}

export function handleRequest<T = any>(path: string, options?: Options): Promise<AxiosResponse<T>> {
  const { req, method, data, ...rest } = options ?? {};
  const headers = req?.headers ?? {};

  const url = findUrl();
  const location = typeof window !== "undefined" ? window.location : null;
  const isDispatchUrl = location?.pathname ?? req?.url;

  const cookieHeader = headers?.cookie;

  return axios({
    url: `${url}${path}`,
    method: method ?? "GET",
    data,
    withCredentials: true,
    ...rest,
    headers: {
      ...rest.headers,
      Cookie: cookieHeader,
      "is-from-dispatch": isDispatchUrl === "/dispatch",
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
