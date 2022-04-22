import type { TableData } from "components/shared/Table/TableProps";
import { classNames } from "lib/classNames";
import { DRAGGABLE_TABLE_HANDLE } from "components/shared/Table";
import { ArrowDownUp, ArrowsExpand } from "react-bootstrap-icons";
import type { Hooks } from "react-table";

export function dndArrowHook<T extends object, RowProps extends object>(
  hooks: Hooks<TableData<T, RowProps>>,
  dndEnabled?: boolean,
) {
  if (!dndEnabled) return;

  hooks.visibleColumns.push((columns) => [
    {
      id: "move",
      Header: () => <ArrowDownUp />,
      Cell: (props: any) => {
        const isDisabled = props.row?.state?.disabled;

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
