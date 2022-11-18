import { Loader, TextField } from "@snailycad/ui";
import type { useAsyncTable } from "components/shared/Table";
import { useTranslations } from "use-intl";

interface SearchAreaProps<T> {
  asyncTable: ReturnType<typeof useAsyncTable<T>>["search"];
  totalCount: number;
}

export function SearchArea<T>(props: SearchAreaProps<T>) {
  const common = useTranslations("Common");

  return (
    <>
      <TextField
        label={common("search")}
        className="my-2 w-full relative"
        name="search"
        onChange={props.asyncTable.setSearch}
        value={props.asyncTable.search}
      >
        {props.asyncTable.state === "loading" ? (
          <span className="absolute top-[2.4rem] right-2.5">
            <Loader />
          </span>
        ) : null}
      </TextField>

      {/* {props.asyncTable.search.search &&
      props.asyncTable.pagination.totalDataCount !== props.totalCount ? (
        <p className="italic text-base font-semibold">
          Showing {props.asyncTable.pagination.totalDataCount} result(s)
        </p>
      ) : null} */}
    </>
  );
}
