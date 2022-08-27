import * as React from "react";
import type { AxiosRequestConfig, AxiosError } from "axios";
import { handleRequest } from "./fetch";
import { type TranslationValues, useTranslations } from "use-intl";
import Common from "../../locales/en/common.json";
import type { FormikHelpers } from "formik";
import { toastMessage } from "./toastMessage";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";

interface UseFetchOptions {
  overwriteState: State | null;
}

type NullableAbortController = AbortController | null;
type State = "loading" | "error";
export type ErrorMessage = keyof typeof import("../../locales/en/common.json")["Errors"];

type Options<Helpers extends object = object> = AxiosRequestConfig & {
  path: string;
  noToast?: boolean | ErrorMessage | (string & {});
  helpers?: FormikHelpers<Helpers>;
};

interface ErrorObj {
  message: ErrorMessage;
  data: TranslationValues;
}

interface ErrorResponseData {
  name: string;
  message: string;
  status: number;
  errors: Record<string, ErrorMessage | ErrorObj>[];
  stack: string;
}

interface Return<Data> {
  json: Data;
  error: null | ErrorMessage | (string & {});
}

export default function useFetch({ overwriteState }: UseFetchOptions = { overwriteState: null }) {
  const [state, setState] = React.useState<State | null>(null);
  const { openModal } = useModal();

  const t = useTranslations("Errors");
  const abortControllerRef = React.useRef<NullableAbortController>(null);

  React.useEffect(() => {
    setState(overwriteState);
  }, [overwriteState]);

  async function execute<Data, Helpers extends object = object>(
    options: Options<Helpers>,
  ): Promise<Return<Data>> {
    setState("loading");
    abortControllerRef.current = new AbortController();
    const { path, ...restOptions } = options;

    const mergedOptions = { ...restOptions, signal: abortControllerRef.current.signal };

    const response = await handleRequest(path, { ...mergedOptions }).catch((e) => {
      setState("error");
      return e;
    });

    const error = isAxiosError<ErrorResponseData | null>(response) ? parseError(response) : null;

    if (error) {
      const errors = parseErrors(response);
      const errorTitle = parseErrorTitle(response);

      const hasKey = isErrorKey(error);
      const key = hasKey ? error : "unknown";
      const errorObj = getErrorObj(response);

      console.error(JSON.stringify({ DEBUG: errorObj }, null, 2));

      if (response?.response?.status === 401) {
        openModal(ModalIds.ReauthorizeSession);
      }

      let hasAddedError = false as boolean; // as boolean because eslint gets upset otherwise.
      for (const error of errors) {
        Object.entries(error).map(([key, value]) => {
          const translationOptions = typeof value === "string" ? undefined : value.data;
          const translationKey = typeof value === "string" ? value : value.message;

          const message = isErrorKey(translationKey)
            ? t(translationKey, translationOptions)
            : translationKey;

          if (message && restOptions.helpers) {
            restOptions.helpers.setFieldError(key, message);
            hasAddedError = true;
          }
        });
      }

      if (
        typeof restOptions.noToast === "string" &&
        restOptions.noToast !== error &&
        !hasAddedError
      ) {
        toastMessage({ message: t(key), title: errorTitle });
      } else if (!restOptions.noToast && !hasAddedError) {
        toastMessage({ message: t(key), title: errorTitle });
      }

      setState("error");

      return {
        json: {} as Data,
        error: isAxiosError<ErrorResponseData | null>(response) ? parseError(response) : null,
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

function parseError(
  error: AxiosError<ErrorResponseData | null>,
): ErrorMessage | "unknown" | (string & {}) {
  const message = error.response?.data?.message ?? error.message;
  const name = error.name;

  if (name && !message && ["NOT_FOUND", "Error"].includes(name)) {
    return name;
  }

  return message || "unknown";
}

function parseErrors(error: AxiosError<ErrorResponseData | null>) {
  return error.response?.data?.errors ?? [];
}

function parseErrorTitle(error: AxiosError<ErrorResponseData | null>) {
  const name = (error.response?.data?.name ?? error.message) as string | undefined;
  if (!name) return;

  return name.toLowerCase().replace(/_/g, " ");
}

function isAxiosError<T>(error: unknown): error is AxiosError<T, T> {
  if (!error) return false;
  return error instanceof Error || (typeof error === "object" && "response" in error);
}

function isErrorKey(key: string | ErrorObj): key is ErrorMessage {
  if (typeof key !== "string") return false;
  return Object.keys(Common.Errors).includes(key);
}

export function getErrorObj(error: unknown) {
  let errorObj = {};

  if (isAxiosError(error)) {
    errorObj = {
      message: error.message,
      status: error.response?.status,
      response: error.response,
      method: error.config.method,
      data: error.config.data,
      url: error.config.url,
    };
  }

  return errorObj;
}
