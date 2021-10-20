import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { IncomingMessage } from "connect";
export type RequestData = Record<string, unknown>;
export type AllowedMethods = "PATCH" | "PUT" | "DELETE" | "OPTIONS" | "GET" | "POST";

interface Options extends AxiosRequestConfig {
  headers?: any;
  req?: Pick<IncomingMessage, "url">;
  method?: AllowedMethods;
  data?: RequestData;
}

export function handleRequest<T = any>(path: string, options?: Options): Promise<AxiosResponse<T>> {
  const url = process.env.NEXT_PUBLIC_PROD_ORIGIN ?? "http://localhost:8080/v1";
  const location = typeof window !== "undefined" ? window.location : null;
  const isDispatchUrl = location?.pathname ?? options?.req?.url;

  return axios({
    url: `${url}${path}`,
    method: options?.method ?? "GET",
    data: options?.data,
    withCredentials: true,
    ...options,
    headers: {
      Cookie: options?.data?.cookie ?? "",
      "Content-Type": "application/json",
      "is-from-dispatch": isDispatchUrl === "/dispatch",
      ...(options?.headers ?? {}),
    },
  });
}
