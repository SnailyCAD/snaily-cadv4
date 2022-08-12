import { TableActionsAlignment } from "@snailycad/types";
import { flexRender, Row, RowData } from "@tanstack/react-table";
import { classNames } from "lib/classNames";

interface Props<TData extends RowData> {
  row: Row<TData>;
  idx: number;
  tableActionsAlignment: TableActionsAlignment | null;
}

export function TableRow<TData extends RowData>({ row, idx, tableActionsAlignment }: Props<TData>) {
  const isLeft = tableActionsAlignment === TableActionsAlignment.LEFT;
  const isNone = tableActionsAlignment === TableActionsAlignment.NONE;
  const dir = isNone ? "" : isLeft ? "left-0" : "right-0";

  return (
    <tr data-row-index={idx} key={row.id}>
      {row.getVisibleCells().map((cell) => {
        const isActions = cell.column.id === "actions";
        const cellValue =
          cell.column.id === "select" ? cell.column.columnDef.cell : cell.getValue<any>();

        return (
          <td
            className={classNames(
              "first:px-5 m-0 text-left p-3 px-3",
              isActions && `w-[10rem] sticky ${dir}`,
              // isMove && "w-10",
              cell.column.id === "actions" && "w-[100px] text-end",
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
