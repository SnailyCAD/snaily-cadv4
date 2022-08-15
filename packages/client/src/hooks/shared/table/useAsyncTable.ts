import * as React from "react";
import useFetch from "lib/useFetch";
import { useDebounce } from "react-use";

interface FetchOptions {
  pageSize: number;
  pageIndex: number;
  path: string;
  onResponse(json: unknown): { data: any; totalCount: number };
}

interface Options<T> {
  totalCount: number;
  initialData: T[];
  scrollToTopOnDataChange?: boolean;
  fetchOptions: Pick<FetchOptions, "onResponse" | "path">;
  state?: { data: T[]; setData(data: T[], query?: string): void };
}

export function useAsyncTable<T>(options: Options<T>) {
  const [totalDataCount, setTotalCount] = React.useState(options.totalCount);
  const [_data, _setData] = React.useState(options.initialData);
  const [search, setSearch] = React.useState("");
  const [extraParams, setExtraParams] = React.useState({});
  const { state: loadingState, execute } = useFetch();

  const scrollToTopOnDataChange = options.scrollToTopOnDataChange ?? true;
  const data = options.state?.data ?? _data;
  const setData = (options.state?.setData ?? _setData) as React.Dispatch<React.SetStateAction<T[]>>;

  const handlePageChange = React.useCallback(
    async ({ pageSize, pageIndex }: Omit<FetchOptions, "path" | "onResponse">) => {
      const { json, error } = await execute({
        path: options.fetchOptions.path,
        params: {
          skip: pageSize * pageIndex,
          query: search.trim() || undefined,
          ...extraParams,
        },
      });

      if (json && !error) {
        const jsonData = options.fetchOptions.onResponse(json);
        setData(jsonData.data);
        setTotalCount(jsonData.totalCount);

        if (scrollToTopOnDataChange) {
          window.scrollTo({ behavior: "smooth", top: 0 });
        }
      }
    },
    [search, extraParams], // eslint-disable-line
  );

  const handleSearch = React.useCallback(async () => {
    const { json, error } = await execute({
      path: options.fetchOptions.path,
      params: { query: search.trim(), ...extraParams },
    });

    if (json && !error) {
      const jsonData = options.fetchOptions.onResponse(json);
      setData(jsonData.data);
      setTotalCount(jsonData.totalCount);
    }
  }, [search, extraParams]); // eslint-disable-line

  useDebounce(handleSearch, 250, [search, handleSearch]);

  const pagination = {
    /** indicates whether data comes from the useAsyncTable hook. */
    __ASYNC_TABLE__: true,
    onPageChange: handlePageChange,
    totalDataCount,
    state: loadingState,
  };

  const _search = {
    search,
    setSearch,
    extraParams,
    setExtraParams,
  };

  return {
    state: loadingState,
    pagination,
    search: _search,
    data,
    setData,
  };
}
