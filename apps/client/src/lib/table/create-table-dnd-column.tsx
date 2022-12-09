import { classNames } from "lib/classNames";
import { DRAGGABLE_TABLE_HANDLE, useTableState } from "components/shared/Table";
import { ArrowDownUp, ArrowsExpand } from "react-bootstrap-icons";
import type { ColumnDef, RowData } from "@tanstack/react-table";

export function createTableDragDropColumn<TData extends RowData>(
  tableState: ReturnType<typeof useTableState>["dragDrop"],
): ColumnDef<TData, keyof TData> {
  return {
    id: "drag-drop",
    header: () => <ArrowDownUp />,
    maxSize: 50,
    cell: ({ row }) => {
      const isDisabled = tableState?.disabledIndices?.includes(row.index);

      return (
        <span
          className={classNames(
            isDisabled ? "cursor-not-allowed" : "cursor-move",
            !isDisabled && DRAGGABLE_TABLE_HANDLE,
          )}
        >
          <ArrowsExpand className="mr-2 text-gray-500 dark:text-gray-400" width={15} />
        </span>
      );
    },
  };
}
