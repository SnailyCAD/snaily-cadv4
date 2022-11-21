import * as React from "react";
import type { GetCitizensData } from "@snailycad/types/api";
import { useAsyncTable } from "components/shared/Table";

interface UseCitizensListOptions {
  search?: string;
  initialData: GetCitizensData;
}

export const MAX_CITIZENS_PER_PAGE = 35;

export function useCitizensList(options: UseCitizensListOptions) {
  const [currentPage, setCurrentPage] = React.useState(0);

  const asyncTable = useAsyncTable({
    search: options.search,
    fetchOptions: {
      path: "/citizen",
      onResponse: (json: GetCitizensData) => ({ totalCount: json.totalCount, data: json.citizens }),
    },
    totalCount: options.initialData.totalCount,
    initialData: options.initialData.citizens,
  });

  const PAGE_COUNT = Math.round(asyncTable.pagination.totalDataCount / MAX_CITIZENS_PER_PAGE);

  async function nextPage() {
    const newPageIndex = currentPage + 1;
    await asyncTable.pagination.onPageChange({
      pageSize: MAX_CITIZENS_PER_PAGE,
      pageIndex: newPageIndex,
    });
    setCurrentPage(newPageIndex);
  }

  async function previousPage() {
    const newPageIndex = currentPage - 1;
    await asyncTable.pagination.onPageChange({
      pageSize: MAX_CITIZENS_PER_PAGE,
      pageIndex: newPageIndex,
    });
    setCurrentPage(newPageIndex);
  }

  async function gotoPage(pageIndex: number) {
    const newPageIndex = pageIndex;
    await asyncTable.pagination.onPageChange({
      pageSize: MAX_CITIZENS_PER_PAGE,
      pageIndex: newPageIndex,
    });
    setCurrentPage(newPageIndex);
  }

  return {
    getState() {
      return { pagination: { pageIndex: currentPage } as any };
    },
    getCanNextPage: () => currentPage < PAGE_COUNT - 1,
    getCanPreviousPage: () => currentPage >= 1,
    setPageIndex: gotoPage as any,
    getPageCount: () => PAGE_COUNT,
    nextPage: nextPage as any,
    previousPage: previousPage as any,

    pageCount: PAGE_COUNT,
    pageOptions: PAGE_COUNT <= 0 ? new Array(1) : new Array(PAGE_COUNT),
    ...asyncTable,
  };
}
