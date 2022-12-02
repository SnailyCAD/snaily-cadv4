import * as React from "react";
import useFetch from "lib/useFetch";
import { useDebounce } from "react-use";
import { useMounted } from "@casper124578/useful";
import { AsyncListData, useListData, useAsyncList } from "@react-stately/data";
import { useQuery, QueryFunctionContext } from "@tanstack/react-query";

interface FetchOptions {
  pageSize: number;
  pageIndex: number;
  path: string;
  requireFilterText?: boolean;
  onResponse(json: unknown): { data: any; totalCount: number };
}

interface Options<T> {
  search?: string;

  disabled?: boolean;
  totalCount: number;
  initialData?: T[];
  scrollToTopOnDataChange?: boolean;
  fetchOptions: Pick<FetchOptions, "onResponse" | "path" | "requireFilterText">;
}

export function useAsyncTable<T>(options: Options<T>) {
  const [debouncedSearch, setDebouncedSearch] = React.useState(options.search);
  const [totalDataCount, setTotalCount] = React.useState(options.totalCount);
 
  const scrollToTopOnDataChange = options.scrollToTopOnDataChange ?? true;
  
  const { data, error, isLoading } = useQuery({
    initialData: options.initialData,
    queryFn: fetchData,
    queryKey: [options.fetchOptions.path, options.pageIndex, options.pageSize, debouncedSearch],
    keepPreviousData: true,
  });

  async function fetchData(context: QueryFunctionContext<any>) {
    // improve handling of these items
    const [pathFn, pageIndex, pageSize, search] = context.queryKey;
    const path = typeof pathFn === "function" ? pathFn(search) : pathFn;
    const skip = Number(pageIndex * pageSize) || 0;
    
    const params = {
      query: search,
      skip,
    };

    const { json } = await execute({ path, params });
    const toReturnData = options.fetchOptions.onResponse(json);
    setTotalCount(toReturnData.totalCount);
    
    if (scrollToTopOnDataChange) {
      window.scrollTo({ behavior: "smooth", top: 0 });
    }

    return toReturnData.data;
  }

  useDebounce(
    () => {
      setDebouncedSearch(options.search);
    },
    200,
    [options.search],
  );

  const list = useListData({ initialItems: options.initialData });
  React.useEffect(() => {
    // todo: this is a hack, fix this
    list.setItems(data);
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps

  const { state: loadingState, execute } = useFetch();
  const isMounted = useMounted();
 
  const asyncList = useAsyncList<T>({
    initialFilterText: options.search,
    async load(state) {
      return { items: [] };
      const sortDescriptor = state.sortDescriptor as Record<string, any>;
      const skip = Number(sortDescriptor.pageIndex * sortDescriptor.pageSize) || 0;

      if (options.fetchOptions.requireFilterText && !sortDescriptor.query) {
        return { items: options.initialData ?? [] };
      }

      if (!isMounted) {
        return { items: options.initialData ?? [] };
      }

      // page size is not supported on any of the API endpoints
      delete sortDescriptor.pageSize;

      const response = await execute({
        path: options.fetchOptions.path,
        params: {
          ...sortDescriptor,
          query: sortDescriptor.query,
          skip,
        },
      });

      const json = options.fetchOptions.onResponse(response.json);
      setTotalCount(json.totalCount);

      if (scrollToTopOnDataChange) {
        window.scrollTo({ behavior: "smooth", top: 0 });
      }

      return {
        items: json.data ?? [],
      };
    },
  }) as AsyncListData<T> & { sortDescriptor?: any; sort(descriptor: any): void };

  React.useEffect(() => {
    // when the initial data changes, we need to update the async list data
    asyncList.reload();
  }, [options.initialData]); // eslint-disable-line

  useDebounce(
    () => {
      if (typeof options.search !== "undefined") {
        asyncList.sort({ ...asyncList.sortDescriptor, pageIndex: 0, query: options.search } as any);
      }
    },
    200,
    [options.search],
  );

  const handlePageChange = React.useCallback(
    async (fetchOptions: Omit<FetchOptions, "path" | "onResponse">) => {
      if (options.disabled) return;

      asyncList.sort({ ...asyncList.sortDescriptor, ...fetchOptions });
    },
    [isMounted, asyncList.sortDescriptor, options.disabled, options.fetchOptions], // eslint-disable-line
  );

  const pagination = {
    /** indicates whether data comes from the useAsyncTable hook. */
    __ASYNC_TABLE__: true,
    onPageChange: handlePageChange,
    totalDataCount,
    isLoading: loadingState === "loading",
  };

  return {
    ...list,
    isLoading,
    pagination,
    items: list.items,
  };
}
