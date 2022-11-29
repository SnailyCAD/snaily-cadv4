import * as React from "react";
import type { RowSelectionState, SortingState, PaginationState } from "@tanstack/react-table";

interface TableStateOptions {
  search?: {
    value: string;
    setValue?(value: string): void;
  };
  dragDrop?: {
    onListChange(list: any[]): void;
    disabledIndices?: number[];
  };
  pagination?: {
    isLoading?: boolean;
    __ASYNC_TABLE__?: boolean;
    totalDataCount: number;
    pageSize?: number;
    onPageChange?(options: { pageSize: number; pageIndex: number }): void;
  };
}

export function useTableState({
  pagination: paginationOptions,
  search,
  dragDrop,
}: TableStateOptions = {}) {
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
      isLoading: paginationOptions?.isLoading ?? false,
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
    dragDrop,
  };
}

type MakeIdFunc<Obj, Id> = (obj: Obj) => Id;
export function getSelectedTableRows<Id extends string, Obj extends { id: Id }>(
  rows: Obj[],
  selectedRows: Record<string, boolean>,
  makeId?: MakeIdFunc<Obj, Id>,
) {
  const selectedRowIds: Id[] = [];

  for (const selectedRow in selectedRows) {
    const idx = parseInt(selectedRow, 10);
    const item = rows[idx];
    if (!item) continue;

    const id = makeId?.(item) ?? item["id"];
    selectedRowIds.push(id);
  }

  return selectedRowIds;
}
