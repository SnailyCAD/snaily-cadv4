import * as React from "react";
import type { ValueType } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { useValues } from "context/ValuesContext";

interface Options {
  valueTypes: ValueType[];
}

/**
 * **note:** can only be used in a `pages/` file
 */
export function useLoadValuesClientSide(options: Options) {
  const fetched = React.useRef<boolean>(false);
  const { execute } = useFetch();
  const { setValues } = useValues();

  function transformValueTypesToString() {
    return options.valueTypes
      .slice(1, options.valueTypes.length)
      .map((type) => type.toLowerCase())
      .join(",");
  }

  const fetchValues = React.useCallback(async () => {
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (!fetched.current) {
      fetchValues();
      fetched.current = true;
    }
  }, [fetchValues]);
}
