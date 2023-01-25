import * as React from "react";
import type { RowSelectionState, SortingState, VisibilityState } from "@tanstack/react-table";
import type { useAsyncTable } from "./use-async-table";
import { useMounted } from "@casper124578/useful";

interface TableStateOptions {
  dragDrop?: {
    onListChange(list: any[]): void;
    disabledIndices?: number[];
  };
  pagination?: Partial<ReturnType<typeof useAsyncTable>["pagination"]>;
  defaultHiddenColumns?: string[];
  tableId?: string;
}

export function useTableState({
  pagination,
  dragDrop,
  tableId,
  defaultHiddenColumns,
}: TableStateOptions = {}) {
  const isMounted = useMounted();

  const _defaultHiddenColumns = React.useMemo(() => {
    return defaultHiddenColumns?.reduce((acc, columnId) => {
      acc[columnId] = false;
      return acc;
    }, {} as VisibilityState);
  }, [defaultHiddenColumns]);

  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>(
    _defaultHiddenColumns || {},
  );

  React.useEffect(() => {
    const json = localStorage.getItem(`tableVisibilityState_${tableId}`);

    if (json) {
      try {
        const parsed = JSON.parse(json);
        setColumnVisibility(parsed);
      } catch (e) {
        console.error(e);
      }
    }
  }, [tableId]);

  React.useEffect(() => {
    if (tableId) {
      localStorage.setItem(`tableVisibilityState_${tableId}`, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility, tableId]);

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});

  const _pagination = {
    pageSize: pagination?.pageSize ?? 35,
    pageIndex: pagination?.pageIndex ?? 0,
    isLoading: pagination?.isLoading ?? false,
    totalDataCount: pagination?.totalDataCount,
    __ASYNC_TABLE__: pagination?.__ASYNC_TABLE__,
  };

  return {
    tableId,
    sorting,
    setSorting,
    rowSelection,
    setRowSelection,
    pagination: _pagination,
    setPagination: pagination?.setPagination,
    dragDrop,
    columnVisibility: isMounted ? columnVisibility : _defaultHiddenColumns,
    setColumnVisibility,
    defaultHiddenColumns,
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
