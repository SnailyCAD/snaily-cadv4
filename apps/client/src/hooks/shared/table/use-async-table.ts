import * as React from "react";
import useFetch from "lib/useFetch";
import { useDebounce } from "react-use";
import { useQuery, type QueryFunctionContext } from "@tanstack/react-query";
import { useList } from "./use-list";

interface FetchOptions {
  pageSize?: number;
  pageIndex?: number;
  path: string;
  requireFilterText?: boolean;
  onResponse(json: unknown): { data: any; totalCount: number };
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
}

interface Options<T> {
  search?: string;

  disabled?: boolean;
  totalCount?: number;
  initialData?: T[];
  scrollToTopOnDataChange?: boolean;
  fetchOptions: FetchOptions;
  getKey?(item: T): React.Key;
}

export function useAsyncTable<T>(options: Options<T>) {
  const scrollToTopOnDataChange = options.scrollToTopOnDataChange ?? true;

  const list = useList<T>({
    getKey: options.getKey,
    initialData: options.initialData ?? [],
    totalCount: options.totalCount ?? 0,
  });
  const { state: loadingState, execute } = useFetch();

  const [debouncedSearch, setDebouncedSearch] = React.useState(options.search);
  const [filters, setFilters] = React.useState<Record<string, any> | null>(null);
  const [paginationOptions, setPagination] = React.useState({
    pageSize: options.fetchOptions.pageSize ?? 35,
    pageIndex: options.fetchOptions.pageIndex ?? 0,
  });

  const { isInitialLoading, error, refetch } = useQuery({
    retry: false,
    enabled: !options.disabled,
    initialData: options.initialData ?? undefined,
    queryFn: fetchData,
    queryKey: [paginationOptions.pageIndex, debouncedSearch, filters, options.fetchOptions.path],
    refetchOnMount: options.fetchOptions.refetchOnMount,
    refetchOnWindowFocus: options.fetchOptions.refetchOnWindowFocus,
  });

  React.useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, [options.search]);

  React.useEffect(() => {
    setPagination({
      pageSize: options.fetchOptions.pageSize ?? 35,
      pageIndex: options.fetchOptions.pageIndex ?? 0,
    });
    list.setItems(options.initialData ?? []);
  }, [options.initialData]); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchData(context: QueryFunctionContext<any>) {
    const [pageIndex, search, _filters] = context.queryKey;
    const path = options.fetchOptions.path;
    const skip = Number(pageIndex * paginationOptions.pageSize) || 0;
    const filters = _filters || {};

    const searchParams = new URLSearchParams();

    filters.query = search;
    filters.skip = skip;

    for (const filterKey in filters) {
      const filterValue = filters[filterKey];

      if (typeof filterValue !== "undefined" && filterValue !== null) {
        searchParams.append(filterKey, filterValue);
      }
    }

    const { json, error } = await execute({
      noToast: true,
      path,
      params: Object.fromEntries(searchParams),
      signal: context.signal,
    });

    if (error) {
      if (error === "Request aborted") return list.items;
      throw new Error(error);
    }

    const toReturnData = options.fetchOptions.onResponse(json);

    if (scrollToTopOnDataChange) {
      window.scrollTo({ behavior: "smooth", top: 0 });
    }

    if (Array.isArray(toReturnData.data)) {
      return list.setItems(toReturnData.data, toReturnData.totalCount);
    }

    return list.setItems([]);
  }

  useDebounce(() => setDebouncedSearch(options.search), 200, [options.search]);

  const pagination = {
    /** indicates whether data comes from the useAsyncTable hook. */
    __ASYNC_TABLE__: true,
    totalDataCount: list.totalCount,
    isLoading: loadingState === "loading",
    setPagination,
    error: error as Error,
    ...paginationOptions,
  } as const;

  return {
    ...list,
    noItemsAvailable: !isInitialLoading && !error && list.items.length <= 0,
    isInitialLoading,
    filters,
    setFilters,
    isLoading: loadingState === "loading",
    pagination,
    refetch,
  };
}
