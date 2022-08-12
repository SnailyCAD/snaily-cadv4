import * as React from "react";
import type { ColumnDef, RowData } from "@tanstack/react-table";
import { classNames } from "lib/classNames";

export function IndeterminateCheckbox({
  indeterminate,
  className = "",
  ...rest
}: { indeterminate?: boolean } & React.HTMLAttributes<HTMLInputElement>) {
  const id = React.useId();
  const ref = React.useRef<HTMLInputElement>(null!);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = indeterminate;
    }
  }, [ref, indeterminate]);

  return (
    <span>
      <label htmlFor={`checkbox_${id}`} className="sr-only">
        Select table row
      </label>
      <input
        id={`checkbox_${id}`}
        type="checkbox"
        ref={ref}
        className={classNames("cursor-pointer", className)}
        {...rest}
      />
    </span>
  );
}

export function makeCheckboxHeader<TData extends RowData>(): ColumnDef<TData> {
  return {
    id: "select",
    header: ({ table }) => (
      <IndeterminateCheckbox
        {...{
          checked: table.getIsAllRowsSelected(),
          indeterminate: table.getIsSomeRowsSelected(),
          onChange: table.getToggleAllRowsSelectedHandler(),
        }}
      />
    ),
    cell: ({ row }) => (
      <IndeterminateCheckbox
        {...{
          checked: row.getIsSelected(),
          indeterminate: row.getIsSomeSelected(),
          onChange: row.getToggleSelectedHandler(),
        }}
      />
    ),
  };
}
