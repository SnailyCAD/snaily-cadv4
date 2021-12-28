/* eslint-disable react/jsx-key */
import { classNames } from "lib/classNames";
import * as React from "react";
import { ArrowDownShort, ArrowDownUp, ArrowsExpand } from "react-bootstrap-icons";
import { useTable, useSortBy, useGlobalFilter, Column, Row } from "react-table";
import { ReactSortable } from "react-sortablejs";

const DRAGGABLE_TABLE_HANDLE = "__TABLE_HANDLE__";

type TableData<T extends object> = {
  rowProps?: JSX.IntrinsicElements["tr"];
} & T;

// eslint-disable-next-line @typescript-eslint/ban-types
interface Props<T extends object = {}> {
  data: readonly TableData<T>[];
  columns: readonly (Column<TableData<T>> | null)[];
  containerProps?: JSX.IntrinsicElements["div"];
  filter?: string;
  dragDrop?: {
    handleMove: (list: any[]) => void;
    enabled?: boolean;
  };
}

export function Table<T extends object>(props: Props<T>) {
  const data = React.useMemo(() => props.data, [props.data]);

  const columns = React.useMemo(
    () => (props.columns.filter(Boolean) as Props["columns"]) ?? [],
    [props.columns],
  );

  const { getTableProps, getTableBodyProps, prepareRow, setGlobalFilter, headerGroups, rows } =
    useTable<TableData<T>>(
      // @ts-expect-error it's complaining that's it's nullable here, but it'll never be null, check line 19.
      { autoResetSortBy: false, columns, data },
      useGlobalFilter,
      useSortBy,
    );

  function handleMove(tableList: any[]) {
    const originals = tableList.map((list) => {
      return list.original?.rowProps?.value;
    });

    props.dragDrop?.handleMove(originals);
  }

  React.useEffect(() => {
    setGlobalFilter(props.filter);
  }, [props.filter, setGlobalFilter]);

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
              {props.dragDrop?.enabled ? (
                <th className="w-[3em]">
                  <ArrowDownUp />
                </th>
              ) : null}
              {headerGroup.headers.map((column) => (
                <th
                  // actions don't need a toggle sort
                  {...column.getHeaderProps(
                    column.id === "actions" ? undefined : column.getSortByToggleProps(),
                  )}
                >
                  <div className="flex items-center gap-3">
                    {column.render("Header")}
                    {column.isSorted ? (
                      <span>
                        <ArrowDownShort
                          className="transition-transform"
                          style={{ transform: column.isSortedDesc ? "" : "rotate(-180deg)" }}
                        />
                      </span>
                    ) : null}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <ReactSortable
          {...getTableBodyProps()}
          animation={200}
          className="mt-5"
          list={rows}
          disabled={!props.dragDrop?.enabled}
          tag="tbody"
          setList={handleMove}
          handle={`.${DRAGGABLE_TABLE_HANDLE}`}
        >
          {rows.map((row) => {
            prepareRow(row);

            return (
              <Row dragDropEnabled={props.dragDrop?.enabled} row={row} {...row.getRowProps()} />
            );
          })}
        </ReactSortable>
      </table>
    </div>
  );
}

type RowProps<T extends object> = {
  row: Row<TableData<T>>;
  dragDropEnabled: boolean | undefined;
};

function Row<T extends object>({ dragDropEnabled, row }: RowProps<T>) {
  const rowProps = row.original.rowProps ?? {};

  return (
    <tr {...rowProps}>
      {dragDropEnabled ? (
        <td className={classNames("cursor-move", DRAGGABLE_TABLE_HANDLE)}>
          <ArrowsExpand className="mr-2 text-gray-500 dark:text-gray-400" width={15} />
        </td>
      ) : null}
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
}
