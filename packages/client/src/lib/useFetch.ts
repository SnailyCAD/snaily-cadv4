import * as React from "react";

interface Props {
  json: boolean;
}

type NullableAbortController = AbortController | null;
type State = "loading" | "error";

export default function useFetch(props: Props = {} as Props) {
  const [state, setState] = React.useState<State | null>(null);
  const abortController = React.useRef<NullableAbortController>(null);

  const execute = async (
    path: string,
    options: RequestInit,
  ): Promise<{
    response: Response;
    json: any;
  }> => {
    let response;
    abortController.current = new AbortController();
    setState("loading");

    try {
      const url = `http://localhost:8080/v1${path}`;
      response = await fetch(url, {
        signal: abortController.current!.signal,
        ...options,
      });
    } catch (error) {
      setState("error");
      return Promise.reject({
        error,
      });
    }

    if (!response.ok) {
      setState("error");

      return Promise.reject({
        response,
        error: new Error(`Request failed: ${response.status}`),
      });
    }

    if (!props.json) {
      setState(null);

      return Promise.resolve({
        response,
        json: {},
      });
    }

    const json = await response.json();
    setState(null);

    return Promise.resolve({
      response,
      json,
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
