/* eslint-disable react/jsx-key */
import { classNames } from "lib/classNames";
import * as React from "react";
import { useTable, Column } from "react-table";

type TableData = {
  rowProps?: JSX.IntrinsicElements["tr"];
  [k: string]: any;
};

interface Props<T extends TableData = TableData> {
  data: readonly TableData[];
  columns: (Column<T> | null)[];
  containerProps?: JSX.IntrinsicElements["div"];
}

export function Table(props: Props) {
  const data = React.useMemo(() => props.data, [props.data]);
  const columns = React.useMemo(
    () => (props.columns.filter(Boolean) as Column<any>[]) ?? [],
    [props.columns],
  );

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } = useTable({
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
