import type { TableData, TableProps } from "components/shared/Table/TableProps";
import { classNames } from "lib/classNames";
import { DRAGGABLE_TABLE_HANDLE } from "components/shared/Table";
import { ArrowDownUp, ArrowsExpand } from "react-bootstrap-icons";
import type { Hooks, CellProps } from "react-table";

export function dndArrowHook<T extends object, RowProps extends object>(
  hooks: Hooks<TableData<T, RowProps>>,
  dragDropProps?: TableProps["dragDrop"],
) {
  if (!dragDropProps?.enabled) return;

  hooks.visibleColumns.push((columns) => [
    {
      id: "move",
      Header: () => <ArrowDownUp />,
      Cell: (props: CellProps<TableData<T, RowProps>>) => {
        const isDisabled = dragDropProps.disabledIndices?.includes(props.row.index);

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
    },
    ...columns,
  ]);
}
