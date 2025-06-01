import { Loader, TextField } from "@snailycad/ui";
import type { useAsyncTable } from "components/shared/Table";
import { classNames } from "lib/classNames";
import { useTranslations } from "use-intl";

interface SearchAreaProps<T> {
  search: { search: string; setSearch(search: string): void };
  asyncTable: Pick<ReturnType<typeof useAsyncTable<T>>, "filters" | "isLoading" | "pagination">;
  totalCount?: number;
  children?: React.ReactNode;
  className?: string;
}

export function SearchArea<T>(props: SearchAreaProps<T>) {
  const common = useTranslations("Common");

  const hasSearch = props.search.search.length > 0;
  const hasFilters = Object.keys(props.asyncTable.filters ?? {}).length > 0;
  const showSearchXResults =
    (hasSearch || hasFilters) && props.asyncTable.pagination.totalDataCount !== props.totalCount;

  return (
    <>
      <div className={classNames("flex items-baseline gap-2", props.className)}>
        <TextField
          label={common("search")}
          className="my-2 w-full col-span-2 relative"
          name="search"
          onChange={props.search.setSearch}
          value={props.search.search}
        >
          {props.asyncTable.isLoading ? (
            <span className="absolute top-[2.4rem] right-2.5">
              <Loader />
            </span>
          ) : null}
        </TextField>

        {props.children}
      </div>

      {showSearchXResults ? (
        <p className="italic text-base font-semibold">
          {common.rich("showingXResults", {
            amount: props.asyncTable.pagination.totalDataCount,
          })}
        </p>
      ) : null}
    </>
  );
}
