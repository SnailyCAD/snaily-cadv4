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
  setDataOnInitialDataChange?: boolean;
  fetchOptions: Pick<FetchOptions, "onResponse" | "path">;
}

export function useAsyncTable<T>(options: Options<T>) {
  const [totalDataCount, setTotalCount] = React.useState(options.totalCount);
  const [data, setData] = React.useState(options.initialData);
  const [search, setSearch] = React.useState("");
  const { state, execute } = useFetch();

  const handlePageChange = React.useCallback(
    async ({ pageSize, pageIndex }: Omit<FetchOptions, "path" | "onResponse">) => {
      const { json, error } = await execute({
        path: options.fetchOptions.path,
        params: {
          skip: pageSize * pageIndex,
          query: search.trim() || undefined,
        },
      });

      if (json && !error) {
        const jsonData = options.fetchOptions.onResponse(json);
        setData(jsonData.data);
        setTotalCount(jsonData.totalCount);

        window.scrollTo({ behavior: "smooth", top: 0 });
      }
    },
    [search], // eslint-disable-line
  );

  const handleSearch = React.useCallback(async () => {
    const { json, error } = await execute({
      path: options.fetchOptions.path,
      params: { query: search.trim() },
    });

    if (json && !error) {
      const jsonData = options.fetchOptions.onResponse(json);
      setData(jsonData.data);
      setTotalCount(jsonData.totalCount);
    }
  }, [search]); // eslint-disable-line

  useDebounce(handleSearch, 250, [search, handleSearch]);

  const pagination = {
    /** indicates whether data comes from the useAsyncTable hook. */
    __ASYNC_TABLE__: true,
    onPageChange: handlePageChange,
    totalDataCount,
    state,
  };

  const _search = {
    search,
    setSearch,
  };

  return {
    state,
    pagination,
    search: _search,
    data,
    setData,
  };
}
