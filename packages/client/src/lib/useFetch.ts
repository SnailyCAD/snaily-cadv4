import * as React from "react";
import type { AxiosRequestConfig, AxiosError } from "axios";
import { handleRequest } from "./fetch";
import { useTranslations } from "use-intl";
import Common from "../../locales/en/common.json";
import type { FormikHelpers } from "formik";
import { toastError } from "./error";

interface UseFetchOptions {
  overwriteState: State | null;
}

type NullableAbortController = AbortController | null;
type State = "loading" | "error";
export type ErrorMessage = keyof typeof import("../../locales/en/common.json")["Errors"];

type Options<Helpers extends object = object> = AxiosRequestConfig & {
  noToast?: boolean | ErrorMessage | (string & {});
  helpers?: FormikHelpers<Helpers>;
};

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

  async function execute<Data = any, Helpers extends object = object>(
    path: string,
    options: Options<Helpers>,
  ): Promise<Return<Data>> {
    setState("loading");
    abortControllerRef.current = new AbortController();

    const mergedOptions = { ...options, signal: abortControllerRef.current.signal };

    const response = await handleRequest(path, { ...mergedOptions }).catch((e) => {
      setState("error");
      return e;
    });

    const error = isAxiosError(response) ? parseError(response) : null;

    if (error) {
      const errors = parseErrors(response);
      const errorTitle = parseErrorTitle(response);

      const hasKey = isErrorKey(error);
      const key = hasKey ? error : "unknown";
      const errorObj = getErrorObj(response);

      console.error(JSON.stringify({ DEBUG: errorObj }, null, 2));

      let hasAddedError = false as boolean; // as boolean because eslint gets upset otherwise.
      for (const error of errors) {
        Object.entries(error).map(([key, value]) => {
          const message = isErrorKey(value) ? t(value) : value;

          if (message && options.helpers) {
            options.helpers.setFieldError(key, message);
            hasAddedError = true;
          }
        });
      }

      if (typeof options.noToast === "string" && options.noToast !== error && !hasAddedError) {
        toastError({ message: t(key), title: errorTitle });
      } else if (!options.noToast && !hasAddedError) {
        toastError({ message: t(key), title: errorTitle });
      }

      setState("error");

      return {
        json: {} as Data,
        error: isAxiosError(response) ? parseError(response) : null,
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

function parseError(error: AxiosError): ErrorMessage | "unknown" | (string & {}) {
  const message = error.response?.data?.message ?? error.message;
  const name = error.response?.data?.name as string | undefined;

  if (name && ["NOT_FOUND", "Error"].includes(name)) {
    return name;
  }

  return message ?? "unknown";
}

function parseErrors(error: AxiosError): Record<string, ErrorMessage>[] {
  return error.response?.data?.errors ?? [];
}

function parseErrorTitle(error: AxiosError) {
  const name = (error.response?.data?.name ?? error.message) as string | undefined;
  if (!name) return;

  return name.toLowerCase().replace(/_/g, " ");
}

function isAxiosError(error: any): error is AxiosError {
  return "response" in error && Object.entries(error.response).length !== 0;
}

function isErrorKey(key: string): key is ErrorMessage {
  return Object.keys(Common.Errors).some((e) => e === key);
}

function getErrorObj(error: unknown) {
  let errorObj = {};

  if (isAxiosError(error)) {
    const err = error as AxiosError;

    errorObj = {
      message: err.message,
      status: err.response?.status,
      response: err.response,
      method: err.config.method,
      data: err.config.data,
      url: err.config.url,
    };
  }

  return errorObj;
}
