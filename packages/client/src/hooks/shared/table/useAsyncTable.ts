import * as React from "react";
import useFetch from "lib/useFetch";
import { useDebounce } from "react-use";

interface FetchOptions {
  pageSize: number;
  pageIndex: number;
  path: string;
  onResponse(json: any): { data: any; totalCount: number };
}

interface Options<T> {
  totalCount: number;
  initialData: T[];
  fetchOptions: Pick<FetchOptions, "onResponse" | "path">;
}

export function useAsyncTable<T>(options: Options<T>) {
  const [totalCount, setTotalCount] = React.useState(options.totalCount);
  const [data, setData] = React.useState(options.initialData);
  const [search, setSearch] = React.useState("");

  const { state, execute } = useFetch();

  const paginationFetch = React.useCallback(
    async ({ pageSize, pageIndex }: Omit<FetchOptions, "path" | "onResponse">) => {
      const { json } = await execute(options.fetchOptions.path, {
        params: {
          skip: pageSize * pageIndex,
          query: search.trim() || undefined,
        },
      });

      if (json) {
        const jsonData = options.fetchOptions.onResponse(json);
        setData(jsonData.data);
        setTotalCount(jsonData.totalCount);
      }
    },
    [search], // eslint-disable-line
  );

  const handleSearch = React.useCallback(async () => {
    if (!search.trim()) {
      setData(options.initialData);
      setTotalCount(options.totalCount);
      return;
    }

    const { json } = await execute(options.fetchOptions.path, {
      params: { query: search.trim() },
    });

    const jsonData = options.fetchOptions.onResponse(json);
    setData(jsonData.data);
    setTotalCount(jsonData.totalCount);
  }, [search]); // eslint-disable-line

  useDebounce(handleSearch, 150, [search, handleSearch]);

  const pagination = {
    fetch: paginationFetch,
    totalCount,
    setTotalCount,
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
