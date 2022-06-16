import * as React from "react";
import create from "zustand";
import type { ValueType } from "@snailycad/types";
import useFetch from "lib/useFetch";
import { useValues } from "context/ValuesContext";

interface Options {
  valueTypes: ValueType[];
}

interface Store {
  fetched: boolean;
  setFetched(fetched: boolean): void;

  valuesToFetch: ValueType[];
  addValuesToFetch(...values: ValueType[]): void;
}

const useStore = create<Store>((set, get) => ({
  fetched: false,
  setFetched: (fetched) => set({ fetched }),

  valuesToFetch: [],
  addValuesToFetch: (...values) => {
    const state = get();
    return set({
      valuesToFetch: [...new Set<ValueType>([...state.valuesToFetch, ...values])],
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

  console.log({ store });

  React.useEffect(() => {
    if (!store.fetched) {
      fetchValues();
      store.setFetched(true);
    }

    return () => {
      store.setFetched(false);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function transformValueTypesToString() {
    return store.valuesToFetch
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
