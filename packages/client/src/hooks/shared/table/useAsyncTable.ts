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
  const [totalCount, setTotalCount] = React.useState(options.totalCount);
  const [data, setData] = React.useState(options.initialData);
  const [search, setSearch] = React.useState<string>("");
  const { state, execute } = useFetch();

  const paginationFetch = React.useCallback(
    async ({ pageSize, pageIndex }: Omit<FetchOptions, "path" | "onResponse">) => {
      const { json, error } = await execute({
        path: options.fetchOptions.path,
        params: {
          skip: pageSize * pageIndex,
          query: (search as string | null)?.trim() || undefined,
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
      params: { query: (search as string | null)?.trim() },
    });

    if (json && !error) {
      const jsonData = options.fetchOptions.onResponse(json);
      setData(jsonData.data);
      setTotalCount(jsonData.totalCount);
    }
  }, [search, options.fetchOptions.path]); // eslint-disable-line

  useDebounce(handleSearch, 250, [search, handleSearch]);

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
