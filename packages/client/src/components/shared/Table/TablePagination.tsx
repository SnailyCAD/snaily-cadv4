import { Button } from "components/Button";
import {
  ChevronDoubleLeft,
  ChevronDoubleRight,
  ChevronLeft,
  ChevronRight,
} from "react-bootstrap-icons";
import type { TableInstance } from "react-table";
import type { TableData } from "./TableProps";

interface Props<T extends object, RowProps extends object> {
  instance: TableInstance<TableData<T, RowProps>>;
}

export function TablePagination<T extends object, RowProps extends object>({
  instance,
}: Props<T, RowProps>) {
  return (
    <div className="mt-5 flex justify-center items-center gap-3">
      <Button onClick={() => instance.gotoPage(0)} disabled={!instance.canPreviousPage}>
        <ChevronDoubleLeft aria-label="Show first page" width={15} height={25} />
      </Button>
      <Button onClick={() => instance.previousPage()} disabled={!instance.canPreviousPage}>
        <ChevronLeft aria-label="Previous page" width={15} height={25} />
      </Button>
      <span>
        {instance.state.pageIndex + 1} of {instance.pageOptions.length}
      </span>
      <Button onClick={() => instance.nextPage()} disabled={!instance.canNextPage}>
        <ChevronRight aria-label="Next page" width={15} height={25} />
      </Button>
      <Button
        onClick={() => instance.gotoPage(instance.pageCount - 1)}
        disabled={!instance.canNextPage}
      >
        <ChevronDoubleRight aria-label="Show last page" width={15} height={25} />
      </Button>
    </div>
  );
}
