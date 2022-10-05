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

  const rowProps = (row.original as any)?.rowProps as Partial<Record<string, any>> | undefined;

  const hasStyle = !!rowProps?.style;
  const bgColor = hasStyle
    ? null
    : rowProps?.className?.includes("bg")
    ? rowProps.className
    : stickyBgColor;

  return (
    <tr {...rowProps} data-row-index={idx} key={row.id}>
      {row.getVisibleCells().map((cell) => {
        const isActions = cell.column.id === "actions";
        const cellValue = ["drag-drop", "select"].includes(cell.column.id)
          ? cell.column.columnDef.cell
          : cell.renderValue<any>();

        return (
          <td
            className={classNames(
              "m-0 text-left p-3 px-3",
              isActions && `w-36 sticky ${dir}`,
              bgColor,
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
