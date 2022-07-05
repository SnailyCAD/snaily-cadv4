/* eslint-disable react/jsx-key */
import * as React from "react";
import { classNames } from "lib/classNames";
import {
  useTable,
  useSortBy,
  useGlobalFilter,
  useRowSelect,
  useRowState,
  usePagination,
  type Column,
  TableState,
} from "react-table";
import { ReactSortable } from "react-sortablejs";
import type { TableData, TableProps } from "./Table/TableProps";
import { useAuth } from "context/AuthContext";
import { TableActionsAlignment } from "@snailycad/types";
import { useMounted } from "@casper124578/useful/hooks/useMounted";
import { TableHead } from "./Table/TableHead";
import { TablePagination } from "./Table/TablePagination";
import { TableRow } from "./Table/TableRow";
import { makeColumns } from "lib/table/makeColumns";
import { dndArrowHook } from "lib/table/dndArrowHook";

export const DRAGGABLE_TABLE_HANDLE = "__TABLE_HANDLE__";

export function Table<T extends object, RowProps extends object>(props: TableProps<T, RowProps>) {
  const MAX_ITEMS_PER_PAGE = props.maxItemsPerPage ?? 35;
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
    ? "bg-gray-100 dark:bg-gray-2"
    : "dark:bg-dark-bg bg-white";

  const columns = React.useMemo(
    () =>
      makeColumns(
        tableActionsAlignment,
        props.columns.filter(Boolean) as Column<TableData<T, RowProps>>[],
      ),
    [props.columns, tableActionsAlignment],
  );

  const controlledPageCount = props.pagination?.enabled
    ? Math.ceil(props.pagination.totalCount / MAX_ITEMS_PER_PAGE)
    : undefined;
  const initialState =
    data.length >= MAX_ITEMS_PER_PAGE ? { pageIndex: state?.pageIndex ?? 0 } : {};

  const instance = useTable<TableData<T, RowProps>>(
    {
      pageCount: props.pagination?.enabled ? controlledPageCount : undefined,
      manualPagination: !!props.pagination?.enabled,
      autoResetSortBy: false,
      columns,
      data,
      initialState: {
        pageSize: MAX_ITEMS_PER_PAGE,
        ...initialState,
      },
    },
    useGlobalFilter,
    useSortBy,
    usePagination,
    useRowState,
    useRowSelect,
    (hooks) => dndArrowHook(hooks, props.dragDrop),
  );

  const {
    getTableProps,
    getTableBodyProps,
    prepareRow,
    setGlobalFilter,
    toggleSortBy,
    headerGroups,
    page,
    state: tableState,
  } = instance;

  React.useEffect(() => {
    setState((p) => ({ ...p, ...instance.state }));

    return () => setState(null);
  }, [instance.state]);

  function handleMove(tableList: any[]) {
    if (!isMounted) return;

    const originals = tableList.map((list) => {
      return list.original?.rowProps?.value;
    });

    props.dragDrop?.handleMove(originals);
  }

  React.useEffect(() => {
    if (!props.pagination?.enabled) return;

    props.pagination.fetchData.fetch({
      pageIndex: tableState.pageIndex,
      pageSize: tableState.pageSize,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableState.pageIndex, tableState.pageSize]);

  React.useEffect(() => {
    setGlobalFilter(props.filter);
  }, [props.filter, setGlobalFilter]);

  React.useEffect(() => {
    props.defaultSort &&
      toggleSortBy(props.defaultSort.columnId as string, props.defaultSort.descending);
  }, [props.defaultSort, toggleSortBy]);

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
        <TableHead
          disabledColumnId={props.disabledColumnId}
          tableActionsAlignment={tableActionsAlignment}
          headerGroups={headerGroups}
        />
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
              <TableRow
                stickyBgColor={stickyBgColor}
                tableActionsAlignment={tableActionsAlignment}
                row={row}
                {...row.getRowProps()}
              />
            );
          })}
        </ReactSortable>
      </table>

      {(props.pagination?.enabled && props.pagination.totalCount > MAX_ITEMS_PER_PAGE) ||
      data.length > MAX_ITEMS_PER_PAGE ? (
        <TablePagination paginationState={props.pagination?.fetchData.state} instance={instance} />
      ) : null}
    </div>
  );
}

export * from "./Table/IndeterminateCheckbox";
