/* eslint-disable @typescript-eslint/ban-types */
import * as React from "react";
import { AxiosRequestConfig, AxiosError } from "axios";
import { handleRequest } from "./fetch";
import toast from "react-hot-toast";
import { useTranslations } from "use-intl";
import Common from "../../locales/en/common.json";

type NullableAbortController = AbortController | null;
type State = "loading" | "error";
export type ErrorMessage = keyof typeof import("../../locales/en/common.json")["Errors"];

type Options = AxiosRequestConfig & { noToast?: boolean };
type Return = {
  json: any;
  error: null | ErrorMessage | (string & {});
};

export default function useFetch(
  { overwriteState }: { overwriteState: State | null } = { overwriteState: null },
) {
  const t = useTranslations("Errors");
  const [state, setState] = React.useState<State | null>(null);
  const abortController = React.useRef<NullableAbortController>(null);

  React.useEffect(() => {
    setState(overwriteState);
  }, [overwriteState]);

  const execute = async (path: string, options: Options): Promise<Return> => {
    setState("loading");
    abortController.current = new AbortController();

    const response = await handleRequest(path, {
      ...{ ...(options as any), signal: abortController.current.signal },
    }).catch((e) => {
      setState("error");
      return e;
    });

    const error = response instanceof Error ? parseError(response as AxiosError) : null;

    if (error) {
      const hasKey = Object.keys(Common.Errors).some((e) => e === error);
      const key = hasKey ? error : "unknown";
      const errorObj = getErrorObj(response);
      console.error({ DEBUG: errorObj });

      if (!options.noToast) {
        toast.error(
          <div
            onClick={() => handleToastClick(response)}
            className="absolute inset-0 flex items-center justify-center rounded-md"
          >
            {t(key)}
          </div>,
        );
      }

      setState("error");

      return {
        json: {},
        error: response instanceof Error ? parseError(response as AxiosError) : null,
      };
    }

    setState(null);

    return {
      json: response?.data ?? {},
      error: null,
    };
  };

  React.useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
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

    console.error({ DEBUG: errorObj });
  }

  return errorObj;
}

function handleToastClick(error: unknown) {
  const errorObj = getErrorObj(error);

  try {
    navigator.clipboard.writeText(JSON.stringify(errorObj, null, 4));
    // eslint-disable-next-line no-empty
  } catch {}
}
