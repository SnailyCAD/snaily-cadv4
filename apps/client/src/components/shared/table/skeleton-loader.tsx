import { Table } from "@tanstack/react-table";
import { classNames } from "lib/classNames";
import { _RowData } from "./table";

interface TableSkeletonLoaderProps<TData extends _RowData> {
  table: Table<TData>;
}

export function TableSkeletonLoader<TData extends _RowData>(
  props: TableSkeletonLoaderProps<TData>,
) {
  const fakeTableRows = new Array(10).fill({}) as unknown[];

  return (
    <div className="flex flex-col w-full whitespace-nowrap">
      <header className="w-full flex overflow-x-auto">
        {props.table.getHeaderGroups().map((headerGroup) =>
          headerGroup.headers.map((header) => (
            <div
              className={classNames(
                "m-0 top-0 sticky p-2 px-3 font-semibold bg-gray-200 dark:bg-secondary text-left select-none",
                "uppercase text-sm text-neutral-700 dark:text-gray-400 first:rounded-tl-md last:rounded-tr-md w-full",
              )}
              key={header.id}
            >
              <div
                aria-hidden
                key={header.id}
                className="dark:bg-tertiary animate-pulse w-full h-4 rounded-md"
              />
            </div>
          )),
        )}
      </header>

      <div className="mt-2">
        {fakeTableRows.map((_, idx) => (
          <div key={idx} className="flex gap-2">
            {props.table.getFlatHeaders().map((header) => (
              <div
                aria-hidden
                key={header.id}
                className="dark:bg-tertiary animate-pulse w-full h-6 mb-2 rounded-md"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
