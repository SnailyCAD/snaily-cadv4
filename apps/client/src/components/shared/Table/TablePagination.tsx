import { Button } from "@snailycad/ui";
import {
  ChevronDoubleLeft,
  ChevronDoubleRight,
  ChevronLeft,
  ChevronRight,
} from "react-bootstrap-icons";
import type { Table, RowData } from "@tanstack/react-table";

interface Props<TData extends RowData> {
  table: Pick<
    Table<TData>,
    | "getCanNextPage"
    | "getCanPreviousPage"
    | "setPageIndex"
    | "getPageCount"
    | "previousPage"
    | "getState"
    | "nextPage"
  >;
}

// todo: add loading states if applicable

export function TablePagination<TData extends RowData>({ table }: Props<TData>) {
  return (
    <div className="mt-5 flex justify-center items-center gap-3">
      <Button onPress={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
        <ChevronDoubleLeft aria-label="Show first page" width={15} height={25} />
      </Button>
      <Button onPress={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
        <ChevronLeft aria-label="Previous page" width={15} height={25} />
      </Button>
      <span>
        {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
      </span>
      <Button onPress={() => table.nextPage()} disabled={!table.getCanNextPage()}>
        <ChevronRight aria-label="Next page" width={15} height={25} />
      </Button>
      <Button
        onPress={() => table.setPageIndex(table.getPageCount() - 1)}
        disabled={!table.getCanNextPage()}
      >
        <ChevronDoubleRight aria-label="Show last page" width={15} height={25} />
      </Button>
    </div>
  );
}
