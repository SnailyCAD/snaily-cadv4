import { flexRender, Row, RowData } from "@tanstack/react-table";
import { classNames } from "lib/classNames";

interface Props<TData extends RowData> {
  row: Row<TData>;
  idx: number;
}

export function TableRow<TData extends RowData>({ row, idx }: Props<TData>) {
  return (
    <tr data-row-index={idx} key={row.id}>
      {row.getVisibleCells().map((cell) => {
        const cellValue =
          cell.column.id === "select" ? cell.column.columnDef.cell : cell.getValue<any>();

        return (
          <td
            className={classNames(
              "first:px-5 m-0 text-left p-3 px-3",
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
