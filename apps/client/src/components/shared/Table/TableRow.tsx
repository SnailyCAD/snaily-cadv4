import { ErrorBoundary } from "@sentry/nextjs";
import { TableActionsAlignment } from "@snailycad/types";
import { Cell, flexRender, Row, RowData } from "@tanstack/react-table";
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
  const rowProps = (row.original as any)?.rowProps as Partial<Record<string, any>> | undefined;

  return (
    <tr {...rowProps} data-row-index={idx} key={row.id}>
      {row.getVisibleCells().map((cell) => {
        return (
          <ErrorBoundary fallback={() => <p>ERROR!</p>} key={cell.id}>
            <TableCell {...{ row, idx, tableActionsAlignment, cell, stickyBgColor, rowProps }} />
          </ErrorBoundary>
        );
      })}
    </tr>
  );
}

function TableCell<TData extends RowData>(
  props: Props<TData> & {
    cell: Cell<TData, any>;
    rowProps: Partial<Record<string, any>> | undefined;
  },
) {
  const isMove = props.cell.column.id === "drag-drop";
  const isActions = props.cell.column.id === "actions";
  const cellValue = ["drag-drop", "select"].includes(props.cell.column.id)
    ? props.cell.column.columnDef.cell
    : props.cell.renderValue<any>();

  const isLeft = props.tableActionsAlignment === TableActionsAlignment.LEFT;
  const isNone = props.tableActionsAlignment === TableActionsAlignment.NONE;
  const dir = isNone ? "" : isLeft ? "left-0" : "right-0";

  const hasStyle = !!props.rowProps?.style;
  const bgColor = hasStyle
    ? null
    : props.rowProps?.className?.includes("bg")
    ? props.rowProps.className
    : props.stickyBgColor;

  return (
    <td
      className={classNames(
        "m-0 text-left p-3 px-3",
        isActions && `w-36 sticky ${dir}`,
        isMove && "w-5",
        bgColor,
      )}
    >
      {flexRender(cellValue, props.cell.getContext())}
    </td>
  );
}
