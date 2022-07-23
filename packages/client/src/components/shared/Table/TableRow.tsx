/* eslint-disable react/jsx-key */
import * as React from "react";
import { TableActionsAlignment } from "@snailycad/types";
import type { TableData } from "./TableProps";
import type { Row as RowType } from "react-table";
import { classNames } from "lib/classNames";

interface RowProps<T extends object, RowProps extends object> {
  row: RowType<TableData<T, RowProps>>;
  tableActionsAlignment: TableActionsAlignment;
  stickyBgColor: string;
}

export function TableRow<T extends object, RP extends object>({
  row,
  stickyBgColor,
  tableActionsAlignment,
}: RowProps<T, RP>) {
  const rowProps = row.original.rowProps ?? ({} as RowProps<T, RP>["row"]["original"]["rowProps"]);
  const isLeft = tableActionsAlignment === TableActionsAlignment.LEFT;
  const isNone = tableActionsAlignment === TableActionsAlignment.NONE;
  const dir = isNone ? "" : isLeft ? "left-0" : "right-0";

  const hasStyle = !!rowProps?.style;
  const bgColor = hasStyle
    ? null
    : rowProps?.className?.includes("bg")
    ? rowProps.className
    : stickyBgColor;

  return (
    <tr {...rowProps}>
      {row.cells.map((cell) => {
        const isActions = cell.column.id === "actions";
        const isMove = ["move", "selection"].includes(cell.column.id);

        return (
          <td
            {...cell.getCellProps()}
            className={classNames(
              "m-0 text-left p-2 px-3",
              isActions && `w-[10rem] sticky ${bgColor} ${dir}`,
              isMove && "w-10",
            )}
          >
            {cell.render("Cell") as React.ReactNode}
          </td>
        );
      })}
    </tr>
  );
}
