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
  state?: { data: T[]; setData(data: T[], query?: string): void };
  fetchOptions: Pick<FetchOptions, "onResponse" | "path">;
}

export function useAsyncTable<T>(options: Options<T>) {
  const [pageIndex, setPageIndex] = React.useState(0);
  const [totalCount, setTotalCount] = React.useState(options.totalCount);
  const [_data, _setData] = React.useState(options.initialData);
  const [search, setSearch] = React.useState("");
  const { state, execute } = useFetch();

  const scrollToTopOnDataChange = options.scrollToTopOnDataChange ?? true;
  const data = React.useMemo(() => {
    if (options.state?.data) {
      const innerData = options.state.data;
      const start = pageIndex * 15;
      const end = start + 15;

      return [...innerData].slice(start, end);
    }

    return _data;
  }, [options.state?.data, pageIndex, _data]);
  const setData = (options.state?.setData ?? _setData) as React.Dispatch<React.SetStateAction<T[]>>;

  const paginationFetch = React.useCallback(
    async ({ pageSize, pageIndex }: Omit<FetchOptions, "path" | "onResponse">) => {
      setPageIndex(pageIndex);

      const { json, error } = await execute({
        path: options.fetchOptions.path,
        params: {
          skip: pageSize * pageIndex,
          query: search.trim() || undefined,
        },
      });

      if (json && !error) {
        const jsonData = options.fetchOptions.onResponse(json);

        // @ts-expect-error ignore
        setData(jsonData.data, search);
        setTotalCount(jsonData.totalCount);

        if (scrollToTopOnDataChange) {
          window.scrollTo({ behavior: "smooth", top: 0 });
        }
      }
    },
    [search, scrollToTopOnDataChange], // eslint-disable-line
  );

  const handleSearch = React.useCallback(async () => {
    const { json, error } = await execute({
      path: options.fetchOptions.path,
      params: { query: search.trim() },
    });

    if (json && !error) {
      const jsonData = options.fetchOptions.onResponse(json);

      // @ts-expect-error ignore
      setData(jsonData.data, search);
      setTotalCount(jsonData.totalCount);
    }
  }, [search]); // eslint-disable-line

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
