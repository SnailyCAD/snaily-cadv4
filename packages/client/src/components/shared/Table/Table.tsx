import * as React from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  RowData,
  useReactTable,
  Header,
  getFilteredRowModel,
  FilterFn,
} from "@tanstack/react-table";
import { TableRow } from "./TableRow";
import { TablePagination } from "./TablePagination";
import { makeCheckboxHeader as makeCheckboxColumn } from "./IndeterminateCheckbox";
import { classNames } from "lib/classNames";
import { TableHeader } from "./TableHeader";
import { useAuth } from "context/AuthContext";
import { TableActionsAlignment } from "@snailycad/types";
import { orderColumnsByTableActionsAlignment } from "lib/table/orderColumnsByTableActionsAlignment";
import { rankItem } from "@tanstack/match-sorter-utils";
import { useTableState } from "hooks/shared/table/useTableState";

interface Props<TData extends RowData> {
  data: TData[];
  columns: (ColumnDef<TData> | null)[];

  tableState: ReturnType<typeof useTableState>;
  containerProps?: { style?: React.CSSProperties; className?: string };

  features?: {
    isWithinCard?: boolean;
    rowSelection?: boolean;
    dragAndDrop?: boolean;
  };
}

export function Table<TData extends RowData>({
  data,
  columns,
  containerProps,
  features,
  tableState,
}: Props<TData>) {
  const { user } = useAuth();
  const dataLength = tableState.pagination.totalDataCount ?? data.length;
  const pageCount = Math.ceil(dataLength / tableState.pagination.pageSize);

  const tableActionsAlignment = user?.tableActionsAlignment ?? TableActionsAlignment.LEFT;
  const stickyBgColor = features?.isWithinCard
    ? "bg-gray-100 dark:bg-gray-2"
    : "dark:bg-dark-bg bg-white";

  const tableColumns = React.useMemo(() => {
    const cols = orderColumnsByTableActionsAlignment(tableActionsAlignment, columns);

    if (features?.rowSelection) {
      cols.unshift(makeCheckboxColumn());
    }

    return cols;
  }, [columns, tableActionsAlignment, features?.rowSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    pageCount,
    enableRowSelection: true,
    enableSorting: true,
    manualPagination: true,
    globalFilterFn: fuzzyFilter,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    onSortingChange: tableState.setSorting,
    onRowSelectionChange: tableState.setRowSelection,
    onPaginationChange: tableState.setPagination,
    onGlobalFilterChange: tableState.setGlobalFilter,
    debugTable: true,
    debugHeaders: true,
    debugColumns: false,
    state: {
      sorting: tableState.sorting,
      rowSelection: tableState.rowSelection,
      pagination: tableState.pagination,
      globalFilter: tableState.globalFilter,
    },
  });

  const visibleTableRows = React.useMemo(() => {
    const rows = table.getRowModel().rows;

    if (tableState.pagination.__ASYNC_TABLE__) {
      return rows;
    }

    const pageStart = tableState.pagination.pageSize * tableState.pagination.pageIndex;
    const pageEnd = pageStart + tableState.pagination.pageSize;

    return rows.slice(pageStart, pageEnd);
  }, [tableState, table]);

  return (
    <div
      className={classNames(
        "block max-w-full mt-3 overflow-x-auto thin-scrollbar pb-5",
        containerProps?.className,
      )}
    >
      <table className="w-full overflow-hidden whitespace-nowrap max-h-64">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHeader<TData>
                    key={header.id}
                    header={header as Header<TData, any>}
                    tableActionsAlignment={tableActionsAlignment}
                  />
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {visibleTableRows.map((row, idx) => (
            <TableRow<TData>
              key={row.id}
              row={row}
              idx={idx}
              tableActionsAlignment={tableActionsAlignment}
              stickyBgColor={stickyBgColor}
            />
          ))}
        </tbody>
      </table>

      <TablePagination table={table} />
    </div>
  );
}

const fuzzyFilter: FilterFn<any> = (row, columnId, value, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), value);

  addMeta({
    itemRank,
  });

  return itemRank.passed;
};

export { useTableState };
export { IndeterminateCheckbox } from "./IndeterminateCheckbox";
