import * as React from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  RowData,
  RowSelectionState,
  SortingState,
  useReactTable,
  Header,
  PaginationState,
} from "@tanstack/react-table";
import { TableRow } from "./TableRow";
import { TablePagination } from "./TablePagination";
import { makeCheckboxHeader as makeCheckboxColumn } from "./IndeterminateCheckbox";
import { classNames } from "lib/classNames";
import { TableHeader } from "./TableHeader";
import { useAuth } from "context/AuthContext";
import { TableActionsAlignment } from "@snailycad/types";
import { orderColumnsByTableActionsAlignment } from "lib/table/orderColumnsByTableActionsAlignment";

interface TableStateOptions {
  pagination?: {
    __ASYNC_TABLE__?: boolean;
    totalDataCount: number;
    pageSize?: number;
    onPageChange?(options: { pageSize: number; pageIndex: number }): void;
  };
}

export function useTableState({ pagination: paginationOptions }: TableStateOptions = {}) {
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
  };
}

interface Props<TData extends RowData> {
  data: TData[];
  columns: (ColumnDef<TData> | null)[];

  tableState: ReturnType<typeof useTableState>;
  containerProps?: { className?: string };

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
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    enableSorting: true,
    onSortingChange: tableState.setSorting,
    onRowSelectionChange: tableState.setRowSelection,
    onPaginationChange: tableState.setPagination,
    pageCount,
    manualPagination: true,

    state: {
      sorting: tableState.sorting,
      rowSelection: tableState.rowSelection,
      pagination: tableState.pagination,
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
