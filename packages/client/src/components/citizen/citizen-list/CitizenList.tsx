import * as React from "react";
import { CitizenListItem } from "components/citizen/citizen-list/CitizenListItem";
import { TablePagination } from "components/shared/Table/TablePagination";
import { useTranslations } from "next-intl";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { useAsyncTable } from "hooks/shared/table/useAsyncTable";
import type { GetCitizensData } from "@snailycad/types/api";

interface Props {
  citizens: GetCitizensData;
}

function useInstance({ array, totalCount }: { totalCount: number; array: any[] }) {
  const [currentPage, setCurrentPage] = React.useState(0);

  const asyncTable = useAsyncTable({
    fetchOptions: {
      path: "/citizen",
      onResponse: (json: GetCitizensData) => ({ totalCount: json.totalCount, data: json.citizens }),
    },
    totalCount,
    initialData: array,
  });

  const MAX_ITEMS_IN_TABLE = 35;
  const PAGE_COUNT = Math.round(asyncTable.pagination.totalCount / MAX_ITEMS_IN_TABLE);

  async function nextPage() {
    const newPageIndex = currentPage + 1;
    await asyncTable.pagination.fetch({ pageSize: MAX_ITEMS_IN_TABLE, pageIndex: newPageIndex });
    setCurrentPage(newPageIndex);
  }

  async function previousPage() {
    const newPageIndex = currentPage - 1;
    await asyncTable.pagination.fetch({ pageSize: MAX_ITEMS_IN_TABLE, pageIndex: newPageIndex });
    setCurrentPage(newPageIndex);
  }

  async function gotoPage(pageIndex: number) {
    const newPageIndex = pageIndex;
    await asyncTable.pagination.fetch({ pageSize: MAX_ITEMS_IN_TABLE, pageIndex: newPageIndex });
    setCurrentPage(newPageIndex);
  }

  return {
    asyncTable,
    state: { pageIndex: currentPage } as any,
    pageCount: PAGE_COUNT,
    canNextPage: currentPage < PAGE_COUNT - 1,
    canPreviousPage: currentPage >= 1,
    pageOptions: PAGE_COUNT <= 0 ? new Array(PAGE_COUNT + 1) : new Array(PAGE_COUNT),
    nextPage: nextPage as any,
    previousPage: previousPage as any,
    gotoPage: gotoPage as any,
  };
}

export function CitizenList({ citizens: data }: Props) {
  const t = useTranslations("Citizen");
  const instance = useInstance({ totalCount: data.totalCount, array: data.citizens });

  if (data.citizens.length <= 0) {
    return <p className="font-medium text-gray-600 dark:text-gray-300">{t("userNoCitizens")}</p>;
  }

  return (
    <>
      <FormField label="Search">
        <Input
          value={instance.asyncTable.search.search}
          onChange={(e) => instance.asyncTable.search.setSearch(e.currentTarget.value)}
        />
      </FormField>

      {instance.asyncTable.search.search &&
      instance.asyncTable.pagination.totalCount !== data.totalCount ? (
        <p className="italic text-base font-semibold my-2">
          Showing {instance.asyncTable.pagination.totalCount} result(s)
        </p>
      ) : null}

      <ul
        className={
          data.citizens.length <= 0
            ? "flex flex-col space-y-3"
            : "grid grid-cols-1 sm:grid-cols-2 gap-2"
        }
      >
        {instance.asyncTable.data.map((citizen) => (
          <CitizenListItem key={citizen.id} citizen={citizen} />
        ))}
      </ul>
      {data.totalCount > 35 ? <TablePagination instance={instance} /> : null}
    </>
  );
}
