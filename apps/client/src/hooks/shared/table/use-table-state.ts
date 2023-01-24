import * as React from "react";
import type { RowSelectionState, SortingState } from "@tanstack/react-table";
import type { useAsyncTable } from "./use-async-table";

interface TableStateOptions {
  search?: {
    value: string;
    setValue?(value: string): void;
  };
  dragDrop?: {
    onListChange(list: any[]): void;
    disabledIndices?: number[];
  };
  pagination?: Partial<ReturnType<typeof useAsyncTable>["pagination"]>;
}

export function useTableState({ pagination, search, dragDrop }: TableStateOptions = {}) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] = React.useState({});

  const _pagination = {
    pageSize: pagination?.pageSize ?? 35,
    pageIndex: pagination?.pageIndex ?? 0,
    isLoading: pagination?.isLoading ?? false,
    totalDataCount: pagination?.totalDataCount,
    __ASYNC_TABLE__: pagination?.__ASYNC_TABLE__,
  };

  return {
    sorting,
    setSorting,
    rowSelection,
    setRowSelection,
    pagination: _pagination,
    setPagination: pagination?.setPagination,
    globalFilter: search?.value,
    setGlobalFilter: search?.setValue,
    dragDrop,
    columnVisibility,
    setColumnVisibility,
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
