/* eslint-disable react/jsx-key */
import { classNames } from "lib/classNames";
import * as React from "react";
import { ArrowDownShort, ArrowDownUp, ArrowsExpand } from "react-bootstrap-icons";
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  useRowSelect,
  Column,
  Row,
  TableInstance,
} from "react-table";
import { ReactSortable } from "react-sortablejs";

const DRAGGABLE_TABLE_HANDLE = "__TABLE_HANDLE__";

type TableData<T extends object, RP extends object> = {
  rowProps?: JSX.IntrinsicElements["tr"] & RP;
} & T;

// eslint-disable-next-line @typescript-eslint/ban-types
interface Props<T extends object = {}, RowProps extends object = {}> {
  data: readonly TableData<T, RowProps>[];
  columns: readonly (Column<TableData<T, RowProps>> | null)[];
  containerProps?: JSX.IntrinsicElements["div"];
  filter?: string;
  Toolbar?: ({ instance }: { instance: TableInstance<TableData<T, RowProps>> }) => JSX.Element;
  disabledColumnId?: Column<TableData<T, RowProps>>["accessor"][];
  defaultSort?: {
    columnId: string;
    descending?: boolean;
  };
  dragDrop?: {
    handleMove: (list: any[]) => void;
    enabled?: boolean;
  };
  selection?: {
    enabled: boolean;
    onSelect?(
      originals: TableData<T, RowProps>[],
      selectedFlatRows: Row<TableData<T, RowProps>>[],
    ): void;
  };
}

export function Table<T extends object, RowProps extends object>(props: Props<T, RowProps>) {
  const data = React.useMemo(() => props.data, [props.data]);

  const columns = React.useMemo(
    () => (props.columns.filter(Boolean) as Props["columns"]) ?? [],
    [props.columns],
  );

  const instance = useTable<TableData<T, RowProps>>(
    // @ts-expect-error it's complaining that's it's nullable here, but it'll never be null, check line 19.
    { autoResetSortBy: false, columns, data },
    useGlobalFilter,
    useSortBy,
    useRowSelect,
    (hooks) => {
      if (props.selection?.enabled) {
        hooks.visibleColumns.push((columns) => [
          {
            id: "selection",
            Header: ({ getToggleAllRowsSelectedProps }) => (
              <div>
                <IndeterminateCheckbox {...getToggleAllRowsSelectedProps()} />
              </div>
            ),
            Cell: ({ row }: any) => (
              <div>
                <IndeterminateCheckbox {...row.getToggleRowSelectedProps()} />
              </div>
            ),
          },
          ...columns,
        ]);
      }

      if (props.dragDrop?.enabled) {
        hooks.visibleColumns.push((columns) => [
          {
            id: "move",
            Header: () => <ArrowDownUp />,
            Cell: () => (
              <span className={classNames("cursor-move", DRAGGABLE_TABLE_HANDLE)}>
                <ArrowsExpand className="mr-2 text-gray-500 dark:text-gray-400" width={15} />
              </span>
            ),
          },
          ...columns,
        ]);
      }
    },
  );

  const {
    getTableProps,
    getTableBodyProps,
    prepareRow,
    setGlobalFilter,
    toggleSortBy,
    headerGroups,
    rows,
    selectedFlatRows,
  } = instance;

  function handleMove(tableList: any[]) {
    const originals = tableList.map((list) => {
      return list.original?.rowProps?.value;
    });

    props.dragDrop?.handleMove(originals);
  }

  React.useEffect(() => {
    if (!props.selection?.enabled) return;
    const originals = selectedFlatRows.map((r) => r.original);

    props.selection.onSelect?.(originals, selectedFlatRows);
  }, [selectedFlatRows, props.selection]);

  React.useEffect(() => {
    setGlobalFilter(props.filter);
  }, [props.filter, setGlobalFilter]);

  React.useEffect(() => {
    props.defaultSort && toggleSortBy(props.defaultSort.columnId, props.defaultSort.descending);
  }, [props.defaultSort, toggleSortBy]);

  const containerProps = {
    ...props?.containerProps,
    className: classNames(
      "block max-w-full mt-3 overflow-x-auto thin-scrollbar",
      props.containerProps?.className,
    ),
  };

  return (
    <div {...containerProps}>
      {props?.Toolbar?.({ instance })}

      <table {...getTableProps()} className="w-full overflow-hidden whitespace-nowrap max-h-64">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => {
                const isSortingDisabledForColumn =
                  props.disabledColumnId?.includes(column.id as any) ||
                  // actions don't need a toggle sort
                  column.id === "actions";

                return (
                  <th
                    {...column.getHeaderProps(
                      isSortingDisabledForColumn ? undefined : column.getSortByToggleProps(),
                    )}
                    className="sticky top-0"
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
                );
              })}
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

            return <Row row={row} {...row.getRowProps()} />;
          })}
        </ReactSortable>
      </table>
    </div>
  );
}

type RowProps<T extends object, RowProps extends object> = {
  row: Row<TableData<T, RowProps>>;
};

function Row<T extends object, RP extends object>({ row }: RowProps<T, RP>) {
  const rowProps = row.original.rowProps ?? {};

  return (
    <tr {...rowProps}>
      {row.cells.map((cell) => {
        const isActions = cell.column.id === "actions";
        const isMove = ["move", "selection"].includes(cell.column.id);

        return (
          <td
            {...cell.getCellProps()}
            className={classNames(isActions && "w-[10rem]", isMove && "w-10")}
          >
            {cell.render("Cell")}
          </td>
        );
      })}
    </tr>
  );
}

const IndeterminateCheckbox = React.forwardRef<HTMLInputElement, any>(
  ({ indeterminate, ...rest }, ref) => {
    const defaultRef = React.useRef<HTMLInputElement>(null);
    const resolvedRef = ref || defaultRef;

    React.useEffect(() => {
      // @ts-expect-error ignore
      resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);

    return (
      <>
        <input type="checkbox" ref={resolvedRef} {...rest} />
      </>
    );
  },
);
