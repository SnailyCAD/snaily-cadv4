import * as React from "react";
import type { RowSelectionState } from "@tanstack/react-table";
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
  asyncTable?: ReturnType<typeof useAsyncTable>;
}

export function useTableState({ asyncTable, search, dragDrop }: TableStateOptions = {}) {
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const _pagination = {
    ...(asyncTable?.pagination ?? {}),
    pageSize: asyncTable?.pagination.pageSize ?? 35,
    pageIndex: asyncTable?.pagination.pageIndex ?? 0,
    isLoading: asyncTable?.pagination.isLoading ?? false,
  };

  return {
    sorting: asyncTable?.sorting,
    setSorting: asyncTable?.setSorting,
    rowSelection,
    setRowSelection,
    pagination: _pagination,
    setPagination: asyncTable?.pagination.setPagination,
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
