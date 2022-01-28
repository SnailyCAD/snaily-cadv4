import type { Column, Row, TableInstance } from "react-table";

export interface TableProps<T extends object = {}, RowProps extends object = {}> {
  data: readonly TableData<T, RowProps>[];
  columns: readonly (Column<TableData<T, RowProps>> | null)[];
  containerProps?: JSX.IntrinsicElements["div"];
  filter?: string;
  Toolbar?: ({ instance }: { instance: TableInstance<TableData<T, RowProps>> }) => JSX.Element;
  disabledColumnId?: Column<TableData<T, RowProps>>["accessor"][];
  defaultSort?: DefaultSort;
  dragDrop?: DragDrop;
  selection?: Selection<T, RowProps>;
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

interface Selection<T extends object = {}, RowProps extends object = {}> {
  enabled: boolean;
  onSelect?(
    originals: TableData<T, RowProps>[],
    selectedFlatRows: Row<TableData<T, RowProps>>[],
  ): void;
}

export type TableData<T extends object, RP extends object> = {
  rowProps?: JSX.IntrinsicElements["tr"] & RP;
} & T;
