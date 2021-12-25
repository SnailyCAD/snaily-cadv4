/* eslint-disable @typescript-eslint/ban-types */
import * as React from "react";
import { AxiosRequestConfig, AxiosError } from "axios";
import { handleRequest } from "./fetch";
import toast from "react-hot-toast";
import { useTranslations } from "use-intl";
import Common from "../../locales/en/common.json";

interface UseFetchOptions {
  overwriteState: State | null;
}

type NullableAbortController = AbortController | null;
type State = "loading" | "error";
export type ErrorMessage = keyof typeof import("../../locales/en/common.json")["Errors"];

type Options = AxiosRequestConfig & { noToast?: boolean };
type Return<Data> = {
  json: Data;
  error: null | ErrorMessage | (string & {});
};

export default function useFetch({ overwriteState }: UseFetchOptions = { overwriteState: null }) {
  const [state, setState] = React.useState<State | null>(null);

  const t = useTranslations("Errors");
  const abortControllerRef = React.useRef<NullableAbortController>(null);

  React.useEffect(() => {
    setState(overwriteState);
  }, [overwriteState]);

  async function execute<Data = any>(path: string, options: Options): Promise<Return<Data>> {
    setState("loading");
    abortControllerRef.current = new AbortController();

    const mergedOptions = { ...options, signal: abortControllerRef.current.signal };

    const response = await handleRequest(path, { ...mergedOptions }).catch((e) => {
      setState("error");
      return e;
    });

    const error = response instanceof Error ? parseError(response as AxiosError) : null;

    if (error) {
      const hasKey = Object.keys(Common.Errors).some((e) => e === error);
      const key = hasKey ? error : "unknown";
      const errorObj = getErrorObj(response);
      console.error({ DEBUG: JSON.stringify(errorObj, null, 2) });

      if (!options.noToast) {
        toast.error(t(key));
      }

      setState("error");

      return {
        json: {} as Data,
        error: response instanceof Error ? parseError(response as AxiosError) : null,
      };
    }

    setState(null);

    return {
      json: response?.data ?? {},
      error: null,
    };
  }

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { execute, state };
}

function parseError(error: AxiosError<any>): ErrorMessage | "unknown" {
  return error.response?.data?.message ?? "unknown";
}

function getErrorObj(error: unknown) {
  let errorObj = {};

  if (error instanceof Error) {
    const err = error as AxiosError;

    errorObj = {
      message: err.message,
      status: err.response?.status,
      response: err.response,
      method: err.config?.method,
      data: err.config?.data,
      url: err.config?.url,
    };
  }

  return errorObj;
}
