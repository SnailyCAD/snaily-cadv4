import { classNames } from "lib/classNames";
import { _RowData } from "./table";

interface TableSkeletonLoaderProps {
  tableHeaders: { id: string }[];
  isWithinCardOrModal?: boolean;
}

export function TableSkeletonLoader(props: TableSkeletonLoaderProps) {
  const fakeTableRows = new Array(10).fill({}) as unknown[];

  return (
    <div className="flex flex-col w-full whitespace-nowrap">
      <header className="w-full flex overflow-x-auto">
        {props.tableHeaders.map((header) => (
          <div
            style={{ width: `${header.id.length * 6}%` }}
            className={classNames(
              "m-0 top-0 sticky p-2 px-1 font-semibold bg-gray-200 dark:bg-secondary text-left select-none",
              "uppercase text-sm text-neutral-700 dark:text-gray-400 first:rounded-tl-md last:rounded-tr-md",
            )}
            key={header.id}
          >
            <div
              aria-hidden
              key={header.id}
              className="dark:bg-tertiary animate-pulse h-4 rounded-md max-w-[6em]"
            />
          </div>
        ))}
      </header>

      <div className="mt-2">
        {fakeTableRows.map((_, idx) => (
          <div key={idx} className="flex gap-2">
            {props.tableHeaders.map((header) => {
              return (
                <div
                  style={{ width: `${header.id.length * 6}%` }}
                  aria-hidden
                  key={header.id}
                  className={classNames(
                    "animate-pulse w-full h-6 mb-2 rounded-md",
                    props.isWithinCardOrModal ? "dark:bg-secondary" : "dark:bg-tertiary",
                  )}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
