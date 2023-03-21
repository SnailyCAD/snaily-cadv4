import { Loader, TextField } from "@snailycad/ui";
import type { useAsyncTable } from "components/shared/Table";
import { useTranslations } from "use-intl";

interface SearchAreaProps<T> {
  search: { search: string; setSearch(search: string): void };
  asyncTable: Pick<ReturnType<typeof useAsyncTable<T>>, "isLoading" | "pagination">;
  totalCount?: number;
  children?: React.ReactNode;
}

export function SearchArea<T>(props: SearchAreaProps<T>) {
  const common = useTranslations("Common");

  return (
    <>
      <div className="flex items-baseline gap-2">
        <TextField
          label={common("search")}
          className="my-2 w-full relative"
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

      {props.search.search && props.asyncTable.pagination.totalDataCount !== props.totalCount ? (
        <p className="italic text-base font-semibold">
          {common.rich("showingXResults", {
            amount: props.asyncTable.pagination.totalDataCount,
          })}
        </p>
      ) : null}
    </>
  );
}
