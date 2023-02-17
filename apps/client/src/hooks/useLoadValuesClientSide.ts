import type { ValueType } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { useValues } from "context/ValuesContext";
import type { GetValuesData } from "@snailycad/types/api";
import { useQuery } from "@tanstack/react-query";

interface Options {
  valueTypes: ValueType[];
  enabled?: boolean;
}

/**
 * **note:** can only be used in a `pages/` file
 */
export function useLoadValuesClientSide(options: Options) {
  const { state, execute } = useFetch();
  const { setValues } = useValues();
  const isEnabled = options.enabled ?? true;

  useQuery({
    queryKey: ["valueTypes", options.valueTypes],
    queryFn: fetchValues,
    enabled: isEnabled,
    refetchOnWindowFocus: false,
  });

  function transformValueTypesToString() {
    return options.valueTypes
      .slice(1, options.valueTypes.length)
      .map((type) => type.toLowerCase())
      .join(",");
  }

  async function fetchValues() {
    if (options.valueTypes.length <= 0) {
      return [];
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
      setValues((prev) => {
        const filtered = prev.filter((v) => !options.valueTypes.includes(v.type as ValueType));

        return [...filtered, ...json];
      });
      return json;
    }

    return [];
  }

  return { isLoading: state === "loading" };
}
