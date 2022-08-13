import type { Column } from "react-table";

export interface TableProps<T extends object = {}, RowProps extends object = {}> {
  data: readonly TableData<T, RowProps>[];
  columns: readonly (Column<TableData<T, RowProps>> | null)[];
  containerProps?: JSX.IntrinsicElements["div"];
  filter?: string;
  defaultSort?: DefaultSort<T, RowProps>;
  dragDrop?: DragDrop;
  isWithinCard?: boolean;
  pagination?: Pagination;
  maxItemsPerPage?: number;
}

export type PaginationFetchFunc = ({
  pageSize,
  pageIndex,
}: {
  pageSize: number;
  pageIndex: number;
}) => Promise<void>;

interface Pagination {
  enabled: boolean;
  totalCount: number;
  fetchData: { state: "loading" | "error" | null; fetch: PaginationFetchFunc };
}

interface DefaultSort<T extends object, RowProps extends object> {
  columnId: Column<TableData<T, RowProps>>["accessor"];
  descending?: boolean;
}

interface DragDrop {
  handleMove(list: any[]): void;
  enabled?: boolean;
  disabledIndices?: number[];
}

export type TableData<T extends object, RowProps extends object> = {
  rowProps?: JSX.IntrinsicElements["tr"] & RowProps;
} & T;
