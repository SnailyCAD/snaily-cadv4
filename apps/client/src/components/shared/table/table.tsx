import * as React from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  RowData,
  useReactTable,
  Header,
  getFilteredRowModel,
  Row,
  AccessorKeyColumnDef,
} from "@tanstack/react-table";
import { TableRow } from "./table-row";
import { TablePagination } from "./table-pagination";
import { classNames } from "lib/classNames";
import { TableHeader } from "./table-header";
import { useAuth } from "context/AuthContext";
import { TableActionsAlignment } from "@snailycad/types";
import { orderColumnsByTableActionsAlignment } from "lib/table/orderColumnsByTableActionsAlignment";
import type { useTableState } from "hooks/shared/table/use-table-state";
import { ReactSortable } from "react-sortablejs";
import { useMounted } from "@casper124578/useful";
import { createTableDragDropColumn } from "lib/table/create-table-dnd-column";
import { createTableCheckboxColumn } from "./indeterminate-checkbox";
import { TableSkeletonLoader } from "./skeleton-loader";

export const DRAGGABLE_TABLE_HANDLE = "__TABLE_HANDLE__";
export type _RowData = RowData & {
  id: string;
};

interface Props<TData extends _RowData> {
  data: TData[];
  columns: (AccessorKeyColumnDef<TData, keyof TData> | null)[];

  isLoading?: boolean;
  tableState: ReturnType<typeof useTableState>;
  containerProps?: { style?: React.CSSProperties; className?: string };

  features?: {
    isWithinCardOrModal?: boolean;
    dragAndDrop?: boolean;
    rowSelection?: boolean;
  };
}

export function Table<TData extends _RowData>({
  data,
  columns,
  containerProps,
  features,
  tableState,
  isLoading,
}: Props<TData>) {
  const isMounted = useMounted();
  const { user } = useAuth();
  const dataLength = tableState.pagination.totalDataCount ?? data.length;
  const pageCount = Math.ceil(dataLength / tableState.pagination.pageSize);

  const tableActionsAlignment = user?.tableActionsAlignment ?? TableActionsAlignment.LEFT;
  const stickyBgColor = features?.isWithinCardOrModal
    ? "bg-gray-100 dark:bg-tertiary"
    : "dark:bg-primary bg-white";

  const tableColumns = React.useMemo(() => {
    const cols = orderColumnsByTableActionsAlignment(tableActionsAlignment, columns);

    if (features?.rowSelection) {
      cols.unshift(createTableCheckboxColumn());
    }

    if (features?.dragAndDrop) {
      cols.unshift(createTableDragDropColumn(tableState.dragDrop));
    }

    return cols;
  }, [columns, tableActionsAlignment, features?.dragAndDrop, tableState.dragDrop?.disabledIndices]); // eslint-disable-line

  const table = useReactTable({
    data,
    columns: tableColumns,
    pageCount,
    enableRowSelection: true,
    enableSorting: true,
    manualPagination: true,

    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),

    onSortingChange: tableState.setSorting,
    onRowSelectionChange: tableState.setRowSelection,
    onPaginationChange: tableState.setPagination,
    onColumnVisibilityChange: tableState.setColumnVisibility,

    state: {
      sorting: tableState.sorting,
      rowSelection: tableState.rowSelection,
      pagination: tableState.pagination,
      columnVisibility: tableState.columnVisibility,
    },
  });

  const visibleTableRows = React.useMemo(() => {
    const rows = table.getRowModel().rows as Row<TData>[];
    const isLengthier = rows.length > tableState.pagination.pageSize;

    if (tableState.pagination.__ASYNC_TABLE__ && !isLengthier) {
      return rows;
    }

    const pageStart = tableState.pagination.pageSize * tableState.pagination.pageIndex;
    const pageEnd = pageStart + tableState.pagination.pageSize;

    return rows.slice(pageStart, pageEnd);
  }, [tableState, table]);

  function handleMove(tableList: any[]) {
    if (!isMounted || !features?.dragAndDrop) return;

    const originals = tableList.map((list) => {
      return list.original?.rowProps?.value;
    });

    tableState.dragDrop?.onListChange(originals);
  }

  const tableLeafs = table.getAllLeafColumns().filter((v) => v.id !== "actions");

  return (
    <div
      className={classNames(
        "block max-w-full mt-3 overflow-x-auto thin-scrollbar pb-5",
        containerProps?.className,
      )}
    >
      {isLoading ? (
        <TableSkeletonLoader
          isWithinCardOrModal={features?.isWithinCardOrModal}
          tableHeaders={table.getFlatHeaders()}
        />
      ) : (
        <table className="w-full whitespace-nowrap max-h-64">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHeader<TData>
                      tableId={tableState.tableId}
                      tableLeafs={tableLeafs}
                      key={header.id}
                      header={header as Header<TData, any>}
                      tableActionsAlignment={tableActionsAlignment}
                    />
                  );
                })}
              </tr>
            ))}
          </thead>
          <ReactSortable
            animation={200}
            className="mt-5"
            list={table.getRowModel().rows}
            tag="tbody"
            disabled={!features?.dragAndDrop}
            setList={handleMove}
            handle={`.${DRAGGABLE_TABLE_HANDLE}`}
          >
            {visibleTableRows.map((row, idx) => (
              <TableRow<TData>
                key={row.id}
                row={row}
                idx={idx}
                tableActionsAlignment={tableActionsAlignment}
                stickyBgColor={stickyBgColor}
              />
            ))}
          </ReactSortable>
        </table>
      )}

      {dataLength <= visibleTableRows.length ? null : (
        <TablePagination isLoading={tableState.pagination.isLoading} table={table} />
      )}
    </div>
  );
}
