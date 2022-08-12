import { TableActionsAlignment } from "@snailycad/types";
import { flexRender, Row, RowData } from "@tanstack/react-table";
import { classNames } from "lib/classNames";

interface Props<TData extends RowData> {
  row: Row<TData>;
  idx: number;
  tableActionsAlignment: TableActionsAlignment | null;
  stickyBgColor: string;
}

export function TableRow<TData extends RowData>({
  row,
  idx,
  tableActionsAlignment,
  stickyBgColor,
}: Props<TData>) {
  const isLeft = tableActionsAlignment === TableActionsAlignment.LEFT;
  const isNone = tableActionsAlignment === TableActionsAlignment.NONE;
  const dir = isNone ? "" : isLeft ? "left-0" : "right-0";

  // todo
  stickyBgColor;

  return (
    <tr data-row-index={idx} key={row.id}>
      {row.getVisibleCells().map((cell) => {
        const isActions = cell.column.id === "actions";
        const cellValue =
          cell.column.id === "select" ? cell.column.columnDef.cell : cell.getValue<any>();

        return (
          <td
            className={classNames(
              "m-0 text-left p-3 px-3",
              isActions && `w-36 sticky ${dir}`,
              // isMove && "w-10",
            )}
            key={cell.id}
          >
            {flexRender(cellValue, cell.getContext())}
          </td>
        );
      })}
    </tr>
  );
}
