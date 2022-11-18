import * as React from "react";
import useFetch from "lib/useFetch";
import { useDebounce } from "react-use";
import { useMounted } from "@casper124578/useful";
import { useAsyncList, useListData } from "@react-stately/data";
import { handleRequest } from "lib/fetch";

interface FetchOptions {
  pageSize: number;
  pageIndex: number;
  path: string;
  onResponse(json: unknown): { data: any; totalCount: number };
}

interface Options<T> {
  search?: string;

  disabled?: boolean;
  totalCount: number;
  initialData: T[];
  scrollToTopOnDataChange?: boolean;
  fetchOptions: Pick<FetchOptions, "onResponse" | "path">;
  state?: { data: T[]; setData(data: T[], query?: string): void };
}

export function useAsyncTable<T>(options: Options<T>) {
  const { execute } = useFetch();

  const [totalDataCount, setTotalCount] = React.useState(options.totalCount);
  const [items, setItems] = React.useState<T[]>(options.initialData);

  const asyncList = useAsyncList<T>({
    async load(state) {
      const sortDescriptor = state.sortDescriptor as Record<string, any>;
      const skip = Number(sortDescriptor.pageIndex * sortDescriptor.pageSize) || 0;

      console.log({ state });

      const response = await execute({
        path: options.fetchOptions.path,
        params: {
          query: sortDescriptor.query,
          skip,
        },
      });

      const json = options.fetchOptions.onResponse(response.json);
      setTotalCount(json.totalCount);
      setItems(json.data);

      if (scrollToTopOnDataChange) {
        window.scrollTo({ behavior: "smooth", top: 0 });
      }

      return {
        items: json.data,
      };
    },
  });

  useDebounce(
    () => {
      if (typeof options.search !== "undefined") {
        asyncList.sort({ ...asyncList.sortDescriptor, pageIndex: 0, query: options.search } as any);
      }
    },
    200,
    [options.search],
  );

  const [_data, _setData] = React.useState(options.initialData);
  const [extraParams, setExtraParams] = React.useState<Record<string, any>>({});
  const { state: loadingState } = useFetch();
  const isMounted = useMounted();

  const scrollToTopOnDataChange = options.scrollToTopOnDataChange ?? true;
  const data = options.state?.data ?? _data;
  const setData = (options.state?.setData ?? _setData) as React.Dispatch<React.SetStateAction<T[]>>;

  const handlePageChange = React.useCallback(
    async ({ pageSize, pageIndex }: Omit<FetchOptions, "path" | "onResponse">) => {
      if (options.disabled) return;
      if (!isMounted) return;

      asyncList.sort({
        pageIndex,
        pageSize,
      } as any);
    },
    [options.search, extraParams, isMounted, options.disabled], // eslint-disable-line
  );

  // const handleSearch = React.useCallback(async () => {
  //   if (options.disabled) return;
  //   if (!isMounted) return;

  //   const { json, error } = await execute({
  //     path: options.fetchOptions.path,
  //     params: { query: search.trim(), ...extraParams },
  //   });

  //   if (json && !error) {
  //     const jsonData = options.fetchOptions.onResponse(json);
  //     if (Array.isArray(jsonData.data)) {
  //       setData(jsonData.data);
  //       setTotalCount(jsonData.totalCount);
  //     }
  //   }
  // }, [search, extraParams, isMounted, options.disabled]); // eslint-disable-line

  const pagination = {
    /** indicates whether data comes from the useAsyncTable hook. */
    __ASYNC_TABLE__: true,
    onPageChange: handlePageChange,
    totalDataCount,
    state: loadingState,
  };

  const _search = {
    search: options.search,
    // setSearch,
    extraParams,
    setExtraParams,
    state: loadingState,
  };

  const list = {
    ...asyncList,
    items,
  };

  return {
    list,
    state: loadingState,
    pagination,
    search: _search,
    data,
    setData,
  };
}
