import * as React from "react";
import {
  ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  OnChangeFn,
  RowData,
  RowSelectionState,
  SortingState,
  useReactTable,
  Header,
  PaginationState,
} from "@tanstack/react-table";
import { TableRow } from "./TableRow";
import { TablePagination } from "./TablePagination";
import { makeCheckboxHeader } from "./IndeterminateCheckbox";
import { classNames } from "lib/classNames";
import { TableHeader } from "./TableHeader";
// import type { TablePaginationOptions } from "src/hooks/useTablePagination";
// import { makeCheckboxHeader } from "./IndeterminateCheckbox";

export function useTableState() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 12,
  });

  return { sorting, setSorting, rowSelection, setRowSelection, pagination, setPagination };
}

interface Props<TData extends RowData> {
  data: TData[];
  columns: (ColumnDef<TData> | null)[];

  tableState: ReturnType<typeof useTableState>;

  containerProps?: { className?: string };
  pageSize?: number;
  pagination?: {
    manualPagination: boolean;
    totalPageCount?: number;
    pageIndex?: number;
    onChange?: OnChangeFn<PaginationState>;
  };

  features?: {
    rowSelection?: boolean;
    dragAndDrop?: boolean;
  };
}

export function Table<TData extends RowData>({
  data,
  columns,
  containerProps,
  pageSize = 35,
  features,
  tableState,
}: Props<TData>) {
  const tableColumns = React.useMemo(() => {
    let cols: ColumnDef<TData>[] = [];

    if (features?.rowSelection) {
      cols = [makeCheckboxHeader(), ...cols];
    }

    for (const column of columns) {
      if (!column) {
        continue;
      }

      cols.push(column);
    }

    return cols;
  }, [columns, features?.rowSelection]);

  const pageCount = Math.ceil(data.length / pageSize);

  const table = useReactTable({
    data,
    columns: tableColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    enableSorting: true,
    pageCount,
    onSortingChange: tableState.setSorting,
    onRowSelectionChange: tableState.setRowSelection,
    onPaginationChange: tableState.setPagination,
    manualPagination: true,

    state: {
      sorting: tableState.sorting,
      rowSelection: tableState.rowSelection,
      pagination: tableState.pagination,
    },
  });

  const visibleTableRows = React.useMemo(() => {
    const rows = table.getRowModel().rows;

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
                    tableActionsAlignment={null}
                  />
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {visibleTableRows.map((row, idx) => (
            <TableRow key={row.id} row={row} idx={idx} />
          ))}
        </tbody>
      </table>

      <TablePagination table={table} />
    </div>
  );
}
