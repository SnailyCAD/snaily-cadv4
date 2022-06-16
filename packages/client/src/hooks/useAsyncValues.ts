import * as React from "react";
import create from "zustand";
import type { ValueType } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { useValues } from "context/ValuesContext";

interface Options {
  valueTypes: ValueType[];
  id: string;
}

/** this will check against the store's `valuesToFetch`, this is wacky, but works for now. */
const AMOUNT_OF_LOADABLE_VALUES = 7;
let hasFetched = false;

interface Store {
  valuesToFetch: ValueType[];
  addValuesToFetch(...values: ValueType[]): void;
}

const useStore = create<Store>((set, get) => ({
  valuesToFetch: [],
  addValuesToFetch: (...values) => {
    const state = get();
    return set({
      valuesToFetch: [...state.valuesToFetch, ...values],
    });
  },
}));

export function useAsyncValues(options: Options) {
  const { state, execute } = useFetch();
  const { setValues } = useValues();
  const store = useStore();

  React.useEffect(() => {
    store.addValuesToFetch(...options.valueTypes);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    if (store.valuesToFetch.length === AMOUNT_OF_LOADABLE_VALUES && !hasFetched) {
      fetchValues();
      hasFetched = true;
    }
  }, [store.valuesToFetch.length]); // eslint-disable-line react-hooks/exhaustive-deps

  function transformValueTypesToString() {
    return [...new Set(store.valuesToFetch)]
      .slice(1, store.valuesToFetch.length)
      .map((type) => type.toLowerCase())
      .join(",");
  }

  const fetchValues = React.useCallback(async () => {
    const [first, ...rest] = store.valuesToFetch;
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
  }, [store.valuesToFetch]); // eslint-disable-line react-hooks/exhaustive-deps

  return { state };
}
