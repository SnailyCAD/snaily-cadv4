import { TableActionsAlignment } from "@snailycad/types";
import type { AccessorKeyColumnDef, ColumnDef, RowData } from "@tanstack/react-table";

export function orderColumnsByTableActionsAlignment<TData extends RowData>(
  tableActionsAlignment: TableActionsAlignment,
  columns: (AccessorKeyColumnDef<TData, keyof TData> | null)[],
): ColumnDef<TData, keyof TData>[] {
  const idxOfActions = columns.findIndex((v) => v?.accessorKey === "actions");
  const isLeft = tableActionsAlignment === TableActionsAlignment.LEFT;

  const arr = [];

  if (idxOfActions === -1 || !isLeft) {
    const cols: ColumnDef<TData, keyof TData>[] = [];

    for (const column of columns) {
      if (!column) continue;
      cols.push(column);
    }

    return cols;
  }

  // shift everything to the right and make place for actions column
  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    if (!column) {
      continue;
    }

    if (column.accessorKey === "actions") continue;
    arr[i + 1] = column;
  }

  if (columns[idxOfActions]) {
    arr[0] = columns[idxOfActions]!;
  }

  return arr;
}
