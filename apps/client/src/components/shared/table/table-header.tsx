import { TableActionsAlignment } from "@snailycad/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@snailycad/ui";
import { type Column, flexRender, type Header, type RowData } from "@tanstack/react-table";
import { classNames } from "lib/classNames";
import { ArrowDownSquareFill, Check, ThreeDots } from "react-bootstrap-icons";

interface Props<TData extends RowData> {
  header: Header<TData, unknown>;
  tableActionsAlignment: TableActionsAlignment | null;
  tableLeafs: Column<TData>[];
  tableId?: string;
}

export function TableHeader<TData extends RowData>({
  header,
  tableActionsAlignment,
  tableLeafs,
  tableId,
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
        "m-0 top-0 sticky p-2 px-3 font-semibold bg-gray-200 dark:bg-secondary lg:table-cell text-left select-none",
        "uppercase text-sm text-neutral-700 dark:text-gray-400 first:rounded-tl-md last:rounded-tr-md",
        isActions ? `${dir} z-10 w-[100px]` : "sticky",
        canSort && "cursor-pointer select-none",
      )}
      key={header.id}
      colSpan={header.colSpan}
      data-column-index={header.index}
      onClick={(event) => {
        if (!canSort) return;
        header.column.getToggleSortingHandler()?.(event);
      }}
    >
      {header.isPlaceholder
        ? null
        : flexRender(header.column.columnDef.header as any, header.getContext())}
      {sortDirection ? (
        <span>
          <ArrowDownSquareFill
            className="transition-transform duration-75 inline-block ml-2"
            style={{ transform: sortDirection === "desc" ? "" : "rotate(-180deg)" }}
            width={15}
            height={15}
          />
        </span>
      ) : null}
      {isActions && tableId ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="xs" className="ml-2 h-7 w-7 inline-grid place-content-center">
              <ThreeDots />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent alignOffset={0} side="left">
            {tableLeafs.map((leaf) => {
              const columnName = (leaf.columnDef.header ?? leaf.id).toString();

              return (
                <DropdownMenuItem
                  closeOnClick={false}
                  key={leaf.id}
                  className={classNames(
                    "flex items-center justify-between",
                    leaf.getIsVisible() && "dark:bg-secondary bg-gray-400",
                  )}
                  onClick={() => leaf.toggleVisibility()}
                >
                  {columnName}

                  {leaf.getIsVisible() ? (
                    <span className="ml-2 text-green-500">
                      <Check aria-label={`Selected ${leaf.id}`} className="dark:text-gray-400" />
                    </span>
                  ) : null}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </th>
  );
}
