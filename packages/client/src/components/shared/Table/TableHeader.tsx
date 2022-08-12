import { TableActionsAlignment } from "@snailycad/types";
import { flexRender, Header, RowData } from "@tanstack/react-table";
import { classNames } from "lib/classNames";
import { ArrowDownSquareFill } from "react-bootstrap-icons";

interface Props<TData extends RowData> {
  header: Header<TData, unknown>;
  tableActionsAlignment: TableActionsAlignment | null;
}

export function TableHeader<TData extends RowData>({
  header,
  tableActionsAlignment,
}: Props<TData>) {
  const isActions = header.id === "actions";
  const canSort = isActions ? false : header.column.getCanSort();
  const sortDirection = header.column.getIsSorted();

  const isLeft = tableActionsAlignment === TableActionsAlignment.LEFT;
  const isNone = tableActionsAlignment === TableActionsAlignment.NONE;
  const dir = isNone ? "" : isLeft ? "left-0" : "right-0";

  return (
    <th
      className={classNames(
        "m-0 top-0 sticky p-2 px-3 font-semibold bg-gray-200 dark:bg-gray-3 lg:table-cell text-left select-none",
        "uppercase text-sm text-neutral-700 dark:text-gray-400 first:rounded-tl-md last:rounded-tr-md",
        isActions ? `${dir} z-10` : "sticky",
        canSort && "cursor-pointer select-none",
        isActions && "w-[100px] text-end",
      )}
      key={header.id}
      colSpan={header.colSpan}
      data-column-index={header.index}
      onClick={(event) => {
        if (!canSort) return;
        header.column.getToggleSortingHandler()?.(event);
      }}
    >
      <span className="flex items-center gap-3">
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header as any, header.getContext())}
        {sortDirection ? (
          <span>
            <ArrowDownSquareFill
              className="transition-transform duration-75"
              style={{ transform: sortDirection === "desc" ? "" : "rotate(-180deg)" }}
              width={15}
              height={15}
            />
          </span>
        ) : null}
      </span>
    </th>
  );
}
