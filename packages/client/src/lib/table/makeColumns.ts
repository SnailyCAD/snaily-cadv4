import type { Column } from "react-table";
import { TableActionsAlignment } from "@snailycad/types";

export function makeColumns<T extends object>(
  tableActionsAlignment: TableActionsAlignment,
  columns: Column<T>[],
) {
  const idxOfActions = columns.findIndex((v) => v.accessor === "actions");
  const isLeft = tableActionsAlignment === TableActionsAlignment.LEFT;

  const arr = [];

  if (idxOfActions === -1 || !isLeft) {
    return columns;
  }

  // shift everything to the right and make place for actions column
  for (let i = 0; i < columns.length; i++) {
    if (columns[i]?.accessor === "actions") continue;
    arr[i + 1] = columns[i]!;
  }

  if (columns[idxOfActions]) {
    arr[0] = columns[idxOfActions]!;
  }

  return arr;
}
