/* eslint-disable react/jsx-key */
import { classNames } from "lib/classNames";
import * as React from "react";
import {
  ArrowDownShort,
  ArrowDownUp,
  ArrowsExpand,
  ChevronDoubleLeft,
  ChevronDoubleRight,
  ChevronLeft,
  ChevronRight,
} from "react-bootstrap-icons";
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  useRowSelect,
  useRowState,
  usePagination,
  type Row as RowType,
  type Column,
  TableState,
} from "react-table";
import { ReactSortable } from "react-sortablejs";
import { Button } from "components/Button";
import type { TableData, TableProps } from "./Table/TableProps";
import { useAuth } from "context/AuthContext";
import { TableActionsAlignment } from "@snailycad/types";
import { useMounted } from "@casper124578/useful/hooks/useMounted";

const DRAGGABLE_TABLE_HANDLE = "__TABLE_HANDLE__";
const MAX_ITEMS_PER_PAGE = 50 as const;

export function Table<T extends object, RowProps extends object>(props: TableProps<T, RowProps>) {
  const isMounted = useMounted();
  /**
   * this keeps track of the table state. If the table re-renders, re-add the state to the table so it doesn't get lost
   * mostly used for pageIndex.
   */
  const [state, setState] = React.useState<TableState<TableData<T, RowProps>> | null>(null);
  const data = React.useMemo(() => props.data, [props.data]);
  const { user } = useAuth();

  const tableActionsAlignment = user?.tableActionsAlignment ?? TableActionsAlignment.LEFT;
  const stickyBgColor = props.isWithinCard
    ? "bg-gray-200/80 dark:bg-gray-2"
    : "dark:bg-dark-bg bg-white";

  const columns = React.useMemo(
    () =>
      makeColumns(
        tableActionsAlignment,
        props.columns.filter(Boolean) as Column<TableData<T, RowProps>>[],
      ),
    [props.columns, tableActionsAlignment],
  );

  const instance = useTable<TableData<T, RowProps>>(
    {
      autoResetSortBy: false,
      columns,
      data,
      initialState: { pageSize: MAX_ITEMS_PER_PAGE, pageIndex: state?.pageIndex },
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowState,
    useRowSelect,
    (hooks) => {
      if (props.dragDrop?.enabled) {
        hooks.visibleColumns.push((columns) => [
          {
            id: "move",
            Header: () => <ArrowDownUp />,
            Cell: (props: any) => {
              const isDisabled = props.row?.state?.disabled;

              return (
                <span
                  className={classNames(
                    isDisabled ? "cursor-not-allowed" : "cursor-move",
                    !isDisabled && DRAGGABLE_TABLE_HANDLE,
                  )}
                >
                  <ArrowsExpand className="mr-2 text-gray-500 dark:text-gray-400" width={15} />
                </span>
              );
            },
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
    page,
  } = instance;

  React.useEffect(() => {
    setState((p) => ({ ...p, ...instance.state }));
  }, [instance.state]);

  function handleMove(tableList: any[]) {
    if (!isMounted) return;

    const originals = tableList.map((list) => {
      return list.original?.rowProps?.value;
    });

    props.dragDrop?.handleMove(originals);
  }

  React.useEffect(() => {
    setGlobalFilter(props.filter);
  }, [props.filter, setGlobalFilter]);

  React.useEffect(() => {
    props.defaultSort && toggleSortBy(props.defaultSort.columnId, props.defaultSort.descending);
  }, [props.defaultSort, toggleSortBy]);

  React.useEffect(() => {
    if (!props.dragDrop?.enabled) return;

    props.dragDrop.disabledIndices?.forEach((i) => {
      const row = instance.rows[i];
      if (!row) return;

      row.setState({ ...row, disabled: true });
    });
  }, [instance.rows, props.dragDrop]);

  const containerProps = {
    ...props.containerProps,
    className: classNames(
      "block max-w-full mt-3 overflow-x-auto thin-scrollbar pb-5",
      props.containerProps?.className,
    ),
  };

  return (
    <div {...containerProps}>
      <table {...getTableProps()} className="w-full overflow-hidden whitespace-nowrap max-h-64">
        <thead>
          {headerGroups.map((headerGroup) => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map((column) => {
                const isSortingDisabledForColumn =
                  (props.disabledColumnId ?? []).includes(column.id as any) ||
                  // actions don't need a toggle sort
                  column.id === "actions";

                const isLeft = tableActionsAlignment === TableActionsAlignment.LEFT;
                const isNone = tableActionsAlignment === TableActionsAlignment.NONE;
                const dir = isNone ? "" : isLeft ? "left-0" : "right-0";

                return (
                  <th
                    {...column.getHeaderProps(
                      isSortingDisabledForColumn ? undefined : column.getSortByToggleProps(),
                    )}
                    className={`top-0 sticky ${column.id === "actions" ? `${dir} z-10` : "sticky"}`}
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
          list={page}
          disabled={!props.dragDrop?.enabled}
          tag="tbody"
          setList={handleMove}
          handle={`.${DRAGGABLE_TABLE_HANDLE}`}
        >
          {page.map((row) => {
            prepareRow(row);

            return (
              <Row
                stickyBgColor={stickyBgColor}
                tableActionsAlignment={tableActionsAlignment}
                row={row}
                {...row.getRowProps()}
              />
            );
          })}
        </ReactSortable>
      </table>

      {data.length > MAX_ITEMS_PER_PAGE ? (
        <div className="mt-5 flex justify-center items-center gap-3">
          <Button onClick={() => instance.gotoPage(0)} disabled={!instance.canPreviousPage}>
            <ChevronDoubleLeft aria-label="Show first page" width={15} height={25} />
          </Button>
          <Button onClick={() => instance.previousPage()} disabled={!instance.canPreviousPage}>
            <ChevronLeft aria-label="Previous page" width={15} height={25} />
          </Button>
          <span>
            {instance.state.pageIndex + 1} of {instance.pageOptions.length}
          </span>
          <Button onClick={() => instance.nextPage()} disabled={!instance.canNextPage}>
            <ChevronRight aria-label="Next page" width={15} height={25} />
          </Button>
          <Button
            onClick={() => instance.gotoPage(instance.pageCount - 1)}
            disabled={!instance.canNextPage}
          >
            <ChevronDoubleRight aria-label="Show last page" width={15} height={25} />
          </Button>
        </div>
      ) : null}
    </div>
  );
}

type RowProps<T extends object, RowProps extends object> = {
  row: RowType<TableData<T, RowProps>>;
  tableActionsAlignment: TableActionsAlignment;
  stickyBgColor: string;
};

function Row<T extends object, RP extends object>({
  row,
  stickyBgColor,
  tableActionsAlignment,
}: RowProps<T, RP>) {
  const rowProps = row.original.rowProps ?? {};

  return (
    <tr {...rowProps}>
      {row.cells.map((cell) => {
        const isActions = cell.column.id === "actions";
        const isMove = ["move", "selection"].includes(cell.column.id);

        const isLeft = tableActionsAlignment === TableActionsAlignment.LEFT;
        const isNone = tableActionsAlignment === TableActionsAlignment.NONE;
        const dir = isNone ? "" : isLeft ? "left-0" : "right-0";

        return (
          <td
            {...cell.getCellProps()}
            className={classNames(
              isActions && `w-[10rem] sticky ${stickyBgColor} ${dir}`,
              isMove && "w-10",
            )}
          >
            {cell.render("Cell")}
          </td>
        );
      })}
    </tr>
  );
}

export const IndeterminateCheckbox = React.forwardRef<HTMLInputElement, any>(
  ({ indeterminate, ...rest }, ref) => {
    const defaultRef = React.useRef<HTMLInputElement>(null);
    const resolvedRef = ref ?? defaultRef;

    React.useEffect(() => {
      // @ts-expect-error ignore
      resolvedRef.current.indeterminate = indeterminate;
    }, [resolvedRef, indeterminate]);

    return (
      <>
        <input className="cursor-pointer" type="checkbox" ref={resolvedRef} {...rest} />
      </>
    );
  },
);

function makeColumns<T extends object>(
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
