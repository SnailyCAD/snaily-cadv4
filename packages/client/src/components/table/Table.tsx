/* eslint-disable react/jsx-key */
import { classNames } from "lib/classNames";
import * as React from "react";
import { useTable, Column } from "react-table";

type TableData<T extends object> = {
  rowProps?: JSX.IntrinsicElements["tr"];
} & T;

// eslint-disable-next-line @typescript-eslint/ban-types
interface Props<T extends object = {}> {
  data: readonly TableData<T>[];
  columns: readonly (Column<TableData<T>> | null)[];
  containerProps?: JSX.IntrinsicElements["div"];
}

export function Table<T extends object>(props: Props<T>) {
  const data = React.useMemo(() => props.data, [props.data]);
  const columns = React.useMemo(
    () => (props.columns.filter(Boolean) as Props["columns"]) ?? [],
    [props.columns],
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable<
    TableData<T>
  >({
    // @ts-expect-error it's complaining that's it's nullable here, but it'll never be null, check line 19.
    columns,
    data,
  });

  const containerProps = {
    ...props?.containerProps,
    className: classNames(
      "w-full mt-3 overflow-x-auto thin-scrollbar",
      props.containerProps?.className,
    ),
  };

  return (
    <div {...containerProps}>
      <table {...getTableProps()} className="w-full overflow-hidden whitespace-nowrap max-h-64">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => (
                <th {...column.getHeaderProps()}>{column.render("Header")}</th>
              ))}
            </tr>
          ))}
        </thead>

        <tbody {...getTableBodyProps()}>
          {rows.map((row) => {
            const rowProps = row.original.rowProps ?? {};
            prepareRow(row);

            return (
              <tr {...row.getRowProps()} {...rowProps}>
                {row.cells.map((cell) => {
                  const isActions = cell.column.id === "actions";

                  return (
                    <td {...cell.getCellProps()} className={isActions ? "w-[10rem]" : ""}>
                      {cell.render("Cell")}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
