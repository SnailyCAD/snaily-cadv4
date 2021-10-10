import * as React from "react";
import { AxiosRequestConfig, AxiosError } from "axios";
import { handleRequest } from "./fetch";
import toast from "react-hot-toast";
import { useTranslations } from "use-intl";

type NullableAbortController = AbortController | null;
type State = "loading" | "error";
export type ErrorMessage = keyof typeof import("../../locales/en/common.json")["Errors"];

export default function useFetch(
  { overwriteState }: { overwriteState: State | null } = { overwriteState: null },
) {
  const t = useTranslations("Errors");
  const [state, setState] = React.useState<State | null>(null);
  const abortController = React.useRef<NullableAbortController>(null);

  React.useEffect(() => {
    setState(overwriteState);
  }, [overwriteState]);

  const execute = async (path: string, options: AxiosRequestConfig) => {
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
      setState("error");
      toast.error(t(error));

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
