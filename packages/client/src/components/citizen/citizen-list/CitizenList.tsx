import * as React from "react";
import type { Citizen, User } from "@snailycad/types";
import { CitizenListItem } from "components/citizen/citizen-list/CitizenListItem";
import { TablePagination } from "components/shared/Table/TablePagination";
import { useTranslations } from "next-intl";

interface Props {
  citizens: (Citizen & { user?: Pick<User, "username"> })[];
}

function useInstance({ array }: { array: any[] }) {
  const [currentPage, setCurrentPage] = React.useState(0);

  const MAX_ITEMS_IN_TABLE = 35;
  const PAGE_COUNT = Math.round(array.length / MAX_ITEMS_IN_TABLE);

  const _array = React.useMemo(() => {
    const end = 35 * currentPage;

    let arr = [];
    for (let i = 0; i < array.length; i++) {
      if (i % end === 0) {
        arr = array.slice(end, end + MAX_ITEMS_IN_TABLE);
      } else if (i === 0) {
        arr = array.slice(0, MAX_ITEMS_IN_TABLE);
      }
    }

    return arr;
  }, [currentPage, array]);

  function nextPage() {
    setCurrentPage((p) => p + 1);
  }

  function previousPage() {
    setCurrentPage((p) => p - 1);
  }

  function gotoPage(pageIndex: number) {
    setCurrentPage(pageIndex);
  }

  return {
    array: _array,
    state: { pageIndex: currentPage } as any,
    pageCount: PAGE_COUNT,
    canNextPage: currentPage < PAGE_COUNT - 1,
    canPreviousPage: currentPage >= 1,
    pageOptions: new Array(PAGE_COUNT),
    nextPage: nextPage as any,
    previousPage: previousPage as any,
    gotoPage: gotoPage as any,
  };
}

export function CitizenList({ citizens }: Props) {
  const t = useTranslations("Citizen");
  const instance = useInstance({ array: citizens });

  if (citizens.length <= 0) {
    return <p className="font-medium text-gray-600 dark:text-gray-300">{t("userNoCitizens")}</p>;
  }

  return (
    <>
      <ul
        className={
          citizens.length <= 0 ? "flex flex-col space-y-3" : "grid grid-cols-1 sm:grid-cols-2 gap-2"
        }
      >
        {instance.array.map((citizen) => (
          <CitizenListItem key={citizen.id} citizen={citizen} />
        ))}
      </ul>
      {citizens.length > 35 ? <TablePagination instance={instance} /> : null}
    </>
  );
}
