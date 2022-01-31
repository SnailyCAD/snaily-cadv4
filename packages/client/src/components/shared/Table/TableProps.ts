import type { Column, TableInstance } from "react-table";

export interface TableProps<T extends object = {}, RowProps extends object = {}> {
  data: readonly TableData<T, RowProps>[];
  columns: readonly (Column<TableData<T, RowProps>> | null)[];
  containerProps?: JSX.IntrinsicElements["div"];
  filter?: string;
  Toolbar?: ({ instance }: { instance: TableInstance<TableData<T, RowProps>> }) => JSX.Element;
  disabledColumnId?: Column<TableData<T, RowProps>>["accessor"][];
  defaultSort?: DefaultSort;
  dragDrop?: DragDrop;
  /**
   * @deprecated use `useTableSelect` instead
   */
  selection?: never;
}

interface DefaultSort {
  columnId: string;
  descending?: boolean;
}

interface DragDrop {
  handleMove: (list: any[]) => void;
  enabled?: boolean;
  disabledIndices?: number[];
}

export type TableData<T extends object, RP extends object> = {
  rowProps?: JSX.IntrinsicElements["tr"] & RP;
} & T;
