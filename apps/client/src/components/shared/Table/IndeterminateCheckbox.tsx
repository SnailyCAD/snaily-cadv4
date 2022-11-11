import * as React from "react";
import type { ColumnDef, RowData } from "@tanstack/react-table";
import { classNames } from "lib/classNames";

export function IndeterminateCheckbox({
  indeterminate,
  className = "",
  ...rest
}: { indeterminate?: boolean } & JSX.IntrinsicElements["input"]) {
  const id = React.useId();
  const ref = React.useRef<HTMLInputElement>(null!);

  React.useEffect(() => {
    if (typeof indeterminate === "boolean") {
      ref.current.indeterminate = !rest.checked && indeterminate;
    }
  }, [ref, rest.checked, indeterminate]);

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

export function createTableCheckboxColumn<TData extends RowData>(): ColumnDef<TData, keyof TData> {
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
