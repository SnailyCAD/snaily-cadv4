/* eslint-disable react/jsx-key */
import { TableActionsAlignment } from "@snailycad/types";
import { classNames } from "lib/classNames";
import { ArrowDownSquareFill } from "react-bootstrap-icons";
import type { HeaderGroup } from "react-table";
import type { TableData, TableProps } from "./TableProps";

interface Props<T extends object, RowProps extends object> {
  headerGroups: HeaderGroup<TableData<T, RowProps>>[];
  tableActionsAlignment: TableActionsAlignment | null;
  disabledColumnId?: TableProps<T, RowProps>["disabledColumnId"];
}

export function TableHead<T extends object, RowProps extends object>({
  headerGroups,
  tableActionsAlignment,
  disabledColumnId = [],
}: Props<T, RowProps>) {
  return (
    <thead>
      {headerGroups.map((headerGroup) => (
        <tr {...headerGroup.getHeaderGroupProps()}>
          {headerGroup.headers.map((column) => {
            const isActions = column.id === "actions";
            const isSortingDisabledForColumn =
              // actions don't need a toggle sort
              disabledColumnId.includes(column.id as any) || isActions;

            const isLeft = tableActionsAlignment === TableActionsAlignment.LEFT;
            const isNone = tableActionsAlignment === TableActionsAlignment.NONE;
            const dir = isNone ? "" : isLeft ? "left-0" : "right-0";

            const thProps = column.getHeaderProps(
              isSortingDisabledForColumn ? undefined : column.getSortByToggleProps(),
            );

            return (
              <th
                {...thProps}
                className={classNames(
                  "m-0 top-0 sticky p-2 px-3 font-semibold bg-gray-200 dark:bg-gray-3 lg:table-cell text-left select-none",
                  "uppercase text-sm text-neutral-700 dark:text-gray-400 first:rounded-tl-md last:rounded-tr-md",
                  isActions ? `${dir} z-10` : "sticky",
                )}
              >
                <span className="flex items-center gap-3">
                  {column.render("Header")}
                  {column.isSorted ? (
                    <span>
                      <ArrowDownSquareFill
                        className="transition-transform duration-75"
                        style={{ transform: column.isSortedDesc ? "" : "rotate(-180deg)" }}
                      />
                    </span>
                  ) : null}
                </span>
              </th>
            );
          })}
        </tr>
      ))}
    </thead>
  );
}
