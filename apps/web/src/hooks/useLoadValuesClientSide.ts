import * as React from "react";
import type { ValueType } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { useValues } from "context/ValuesContext";
import type { GetValuesData } from "@snailycad/types/api";

interface Options {
  valueTypes: ValueType[];
  enabled?: boolean;
}

/**
 * **note:** can only be used in a `pages/` file
 */
export function useLoadValuesClientSide(options: Options) {
  const fetched = React.useRef<boolean>(false);
  const { state, execute } = useFetch();
  const { setValues } = useValues();

  const enabled = options.enabled ?? true;

  function transformValueTypesToString() {
    return options.valueTypes
      .slice(1, options.valueTypes.length)
      .map((type) => type.toLowerCase())
      .join(",");
  }

  const fetchValues = React.useCallback(async () => {
    if (!enabled) return;

    if (options.valueTypes.length <= 0) {
      throw new Error("Must provide at least 1 value type");
    }

    const [first, ...rest] = options.valueTypes;

    const firstType = first!.toLowerCase();
    const params = new URLSearchParams();

    if (rest.length >= 1) {
      params.append("paths", transformValueTypesToString());
    }

    const { json } = await execute<GetValuesData>({
      path: `/admin/values/${firstType}?${params.toString()}`,
      method: "GET",
    });

    if (Array.isArray(json)) {
      setValues((prev) => [...prev, ...json]);
    }
  }, [options.valueTypes, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!fetched.current) {
      fetchValues();
      fetched.current = true;
    }
  }, [fetchValues]);

  return { isLoading: state === "loading" };
}
