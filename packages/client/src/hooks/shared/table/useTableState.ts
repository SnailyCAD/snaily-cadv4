import * as React from "react";
import type { RowSelectionState, SortingState, PaginationState } from "@tanstack/react-table";

interface TableStateOptions {
  search?: {
    value: string;
    setValue(value: string): void;
  };
  pagination?: {
    __ASYNC_TABLE__?: boolean;
    totalDataCount: number;
    pageSize?: number;
    onPageChange?(options: { pageSize: number; pageIndex: number }): void;
  };
}

export function useTableState({ pagination: paginationOptions, search }: TableStateOptions = {}) {
  const pageSize = paginationOptions?.pageSize ?? 35;

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize,
  });

  React.useEffect(() => {
    paginationOptions?.onPageChange?.(pagination);
  }, [pagination]); // eslint-disable-line

  const _pagination = React.useMemo(
    () => ({
      pageSize: pagination.pageSize,
      pageIndex: pagination.pageIndex,
      totalDataCount: paginationOptions?.totalDataCount,
      __ASYNC_TABLE__: paginationOptions?.__ASYNC_TABLE__,
    }),
    [pagination, paginationOptions],
  );

  return {
    sorting,
    setSorting,
    rowSelection,
    setRowSelection,
    pagination: _pagination,
    setPagination,
    globalFilter: search?.value,
    setGlobalFilter: search?.setValue,
  };
}
