import * as React from "react";
import useFetch from "lib/useFetch";
import { useDebounce } from "react-use";
import { useQuery, QueryFunctionContext } from "@tanstack/react-query";
import { useList } from "./use-list";

interface FetchOptions {
  pageSize?: number;
  pageIndex?: number;
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
  fetchOptions: FetchOptions;
}

export function useAsyncTable<T>(options: Options<T>) {
  const scrollToTopOnDataChange = options.scrollToTopOnDataChange ?? true;

  const list = useList<T>({ initialData: options.initialData ?? [] });
  const { state: loadingState, execute } = useFetch();

  const [debouncedSearch, setDebouncedSearch] = React.useState(options.search);
  const [totalDataCount, setTotalCount] = React.useState(options.totalCount);
  const [paginationOptions, setPagination] = React.useState({
    pageSize: options.fetchOptions.pageSize ?? 35,
    pageIndex: options.fetchOptions.pageIndex ?? 0,
  });

  useQuery({
    initialData: options.initialData,
    queryFn: fetchData,
    queryKey: [paginationOptions.pageIndex, debouncedSearch],
  });

  async function fetchData(context: QueryFunctionContext<any>) {
    const [pageIndex, search] = context.queryKey;
    const path = options.fetchOptions.path;
    const skip = Number(pageIndex * paginationOptions.pageSize) || 0;

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

    if (scrollToTopOnDataChange) {
      window.scrollTo({ behavior: "smooth", top: 0 });
    }

    return list.setItems(toReturnData.data);
  }

  useDebounce(() => setDebouncedSearch(options.search), 200, [options.search]);

  const pagination = {
    /** indicates whether data comes from the useAsyncTable hook. */
    __ASYNC_TABLE__: true,
    totalDataCount,
    isLoading: loadingState === "loading",
    setPagination,
    ...paginationOptions,
  } as const;

  return {
    ...list,
    isLoading: loadingState === "loading",
    pagination,
  };
}
