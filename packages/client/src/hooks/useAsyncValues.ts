import * as React from "react";
import type { ValueType } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { useValues } from "context/ValuesContext";

interface Options {
  valueTypes: ValueType[];
  id: string;
}

const ASYNC_VALUES_HOOK_USED_TIMES = 2;
let fetchCount = 0;

export function useAsyncValues(options: Options) {
  const { state, execute } = useFetch();
  const { setValues } = useValues();

  function transformValueTypesToString() {
    return options.valueTypes
      .slice(1, options.valueTypes.length)
      .map((type) => type.toLowerCase())
      .join(",");
  }

  const fetchOnOpen = React.useCallback(async () => {
    const [first, ...rest] = options.valueTypes;
    const hasMore = rest.length >= 1;

    const { json } = await execute(
      `/admin/values/${first?.toLowerCase()}${
        hasMore ? `?paths=${transformValueTypesToString()}` : ""
      }`,
      {
        method: "GET",
      },
    );

    if (Array.isArray(json)) {
      setValues((prev) => [...prev, ...json]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (fetchCount <= ASYNC_VALUES_HOOK_USED_TIMES - 1) {
      fetchOnOpen();
      fetchCount += 1;
    }
  }, [fetchOnOpen]);

  return { state };
}
