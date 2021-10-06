import * as React from "react";
import type { AxiosRequestConfig, AxiosResponse } from "axios";
import { handleRequest } from "./fetch";

type NullableAbortController = AbortController | null;
type State = "loading" | "error";

export default function useFetch(
  { overwriteState }: { overwriteState: State | null } = { overwriteState: null },
) {
  const [state, setState] = React.useState<State | null>(null);
  const abortController = React.useRef<NullableAbortController>(null);

  React.useEffect(() => {
    setState(overwriteState);
  }, [overwriteState]);

  const execute = async (
    path: string,
    options: AxiosRequestConfig,
  ): Promise<{
    response: AxiosResponse<any>;
    json: any;
  }> => {
    let response;
    abortController.current = new AbortController();
    setState("loading");

    try {
      response = await handleRequest(path, {
        ...(options as any),
      });
    } catch (error) {
      setState("error");
      return Promise.reject({
        error,
      });
    }

    setState(null);

    return Promise.resolve({
      response,
      json: response.data,
    });
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
