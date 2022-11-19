import * as React from "react";
import useFetch from "lib/useFetch";
import { useDebounce } from "react-use";
import { useMounted } from "@casper124578/useful";
import { AsyncListData, useAsyncList } from "@react-stately/data";

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
  const isMounted = useMounted();

  const [totalDataCount, setTotalCount] = React.useState(options.totalCount);
  const [items, setItems] = React.useState<T[]>(options.initialData);

  React.useEffect(() => {
    setItems(options.initialData);
  }, [options.initialData]);

  const asyncList = useAsyncList<T>({
    initialFilterText: options.search,
    async load(state) {
      if (!isMounted) {
        return { items: options.initialData };
      }

      const sortDescriptor = state.sortDescriptor as Record<string, any>;
      const skip = Number(sortDescriptor.pageIndex * sortDescriptor.pageSize) || 0;

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
      setItems(json.data);

      if (scrollToTopOnDataChange) {
        window.scrollTo({ behavior: "smooth", top: 0 });
      }

      return {
        items: json.data,
      };
    },
  }) as AsyncListData<T> & { sortDescriptor?: any; sort(descriptor: any): void };

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
  const { state: loadingState } = useFetch();
  const scrollToTopOnDataChange = options.scrollToTopOnDataChange ?? true;
  const data = options.state?.data ?? _data;
  const setData = (options.state?.setData ?? _setData) as React.Dispatch<React.SetStateAction<T[]>>;

  const handlePageChange = React.useCallback(
    async ({ pageSize, pageIndex }: Omit<FetchOptions, "path" | "onResponse">) => {
      if (options.disabled) return;

      asyncList.sort({ ...asyncList.sortDescriptor, pageIndex, pageSize });
    },
    [isMounted, asyncList.sortDescriptor, options.disabled], // eslint-disable-line
  );

  const pagination = {
    /** indicates whether data comes from the useAsyncTable hook. */
    __ASYNC_TABLE__: true,
    onPageChange: handlePageChange,
    totalDataCount,
    state: loadingState,
  };

  const list = {
    ...asyncList,
    items: isMounted ? asyncList.items : items,
  };

  return {
    ...list,
    state: loadingState,
    pagination,
    // data,
    // setData,
  };
}
