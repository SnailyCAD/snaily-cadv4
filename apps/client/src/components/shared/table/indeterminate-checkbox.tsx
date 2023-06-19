import * as React from "react";
import type { ColumnDef, RowData } from "@tanstack/react-table";
import { CheckboxField } from "@snailycad/ui";

interface IndeterminateCheckbox {
  isSelected: boolean;
  isIndeterminate: boolean;
  onChange(isSelected?: boolean): void;
}

export function IndeterminateCheckbox({
  isIndeterminate,
  isSelected,
  onChange,
}: IndeterminateCheckbox) {
  return (
    <CheckboxField
      isIndeterminate={isIndeterminate}
      isSelected={isSelected}
      onChange={onChange}
      aria-label="Select table row"
      className="cursor-pointer mb-0"
    />
  );
}

export function createTableCheckboxColumn<TData extends RowData>(): ColumnDef<TData, keyof TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <IndeterminateCheckbox
        isSelected={table.getIsAllRowsSelected()}
        isIndeterminate={table.getIsSomeRowsSelected()}
        onChange={table.toggleAllRowsSelected}
      />
    ),
    cell: ({ row }) => (
      <IndeterminateCheckbox
        isSelected={row.getIsSelected()}
        isIndeterminate={row.getIsSomeSelected()}
        onChange={row.toggleSelected}
      />
    ),
  };
}
