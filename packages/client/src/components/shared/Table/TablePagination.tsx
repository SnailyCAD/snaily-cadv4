import { Button } from "components/Button";
import {
  ChevronDoubleLeft,
  ChevronDoubleRight,
  ChevronLeft,
  ChevronRight,
} from "react-bootstrap-icons";
import type { TableInstance } from "react-table";
import type { TableData } from "./TableProps";

type TablePicks =
  | "canPreviousPage"
  | "nextPage"
  | "previousPage"
  | "canNextPage"
  | "gotoPage"
  | "pageCount"
  | "pageOptions"
  | "state";

interface Props<T extends object, RowProps extends object> {
  instance: Pick<TableInstance<TableData<T, RowProps>>, TablePicks>;
  paginationState?: "error" | "loading" | null;
}

export function TablePagination<T extends object, RowProps extends object>({
  instance,
  paginationState,
}: Props<T, RowProps>) {
  const isLoading = paginationState === "loading";

  return (
    <div className="mt-5 flex justify-center items-center gap-3">
      <Button
        onClick={() => instance.gotoPage(0)}
        disabled={isLoading || !instance.canPreviousPage}
      >
        <ChevronDoubleLeft aria-label="Show first page" width={15} height={25} />
      </Button>
      <Button
        onClick={() => instance.previousPage()}
        disabled={isLoading || !instance.canPreviousPage}
      >
        <ChevronLeft aria-label="Previous page" width={15} height={25} />
      </Button>
      <span>
        {instance.state.pageIndex + 1} of {instance.pageOptions.length}
      </span>
      <Button onClick={() => instance.nextPage()} disabled={isLoading || !instance.canNextPage}>
        <ChevronRight aria-label="Next page" width={15} height={25} />
      </Button>
      <Button
        onClick={() => instance.gotoPage(instance.pageCount - 1)}
        disabled={isLoading || !instance.canNextPage}
      >
        <ChevronDoubleRight aria-label="Show last page" width={15} height={25} />
      </Button>
    </div>
  );
}
