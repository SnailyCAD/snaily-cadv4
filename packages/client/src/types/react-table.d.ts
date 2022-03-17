/* eslint-disable */
import type * as T from "react-table";

declare module "react-table" {
  // take this file as-is, or comment out the sections that don't apply to your plugin configuration

  export interface TableOptions<D extends Record<string, unknown>>
    extends T.UseExpandedOptions<D>,
      T.UseFiltersOptions<D>,
      T.UseGlobalFiltersOptions<D>,
      T.UseGroupByOptions<D>,
      T.UsePaginationOptions<D>,
      T.UseResizeColumnsOptions<D>,
      T.UseRowSelectOptions<D>,
      T.UseRowStateOptions<D>,
      T.UseSortByOptions<D> {}

  export interface Hooks<D extends Record<string, unknown> = Record<string, unknown>>
    extends T.UseExpandedHooks<D>,
      T.UseGroupByHooks<D>,
      T.UseRowSelectHooks<D>,
      T.UseSortByHooks<D> {}

  export interface TableInstance<D extends Record<string, unknown> = Record<string, unknown>>
    extends T.UseColumnOrderInstanceProps<D>,
      T.UseExpandedInstanceProps<D>,
      T.UseFiltersInstanceProps<D>,
      T.UseGlobalFiltersInstanceProps<D>,
      T.UseGroupByInstanceProps<D>,
      T.UsePaginationInstanceProps<D>,
      T.UseRowSelectInstanceProps<D>,
      T.UseRowStateInstanceProps<D>,
      T.UseSortByInstanceProps<D> {}

  export interface TableState<D extends Record<string, unknown> = Record<string, unknown>>
    extends T.UseColumnOrderState<D>,
      T.UseExpandedState<D>,
      T.UseFiltersState<D>,
      T.UseGlobalFiltersState<D>,
      T.UseGroupByState<D>,
      T.UsePaginationState<D>,
      T.UseResizeColumnsState<D>,
      T.UseRowSelectState<D>,
      T.UseRowStateState<D>,
      T.UseSortByState<D> {}

  export interface ColumnInterface<D extends Record<string, unknown> = Record<string, unknown>>
    extends T.UseFiltersColumnOptions<D>,
      T.UseGlobalFiltersColumnOptions<D>,
      T.UseGroupByColumnOptions<D>,
      T.UseResizeColumnsColumnOptions<D>,
      T.UseSortByColumnOptions<D> {}

  export interface ColumnInstance<D extends Record<string, unknown> = Record<string, unknown>>
    extends T.UseFiltersColumnProps<D>,
      T.UseGroupByColumnProps<D>,
      T.UseResizeColumnsColumnProps<D>,
      T.UseSortByColumnProps<D> {}

  export interface Cell<D extends Record<string, unknown> = Record<string, unknown>, V = any>
    extends T.UseGroupByCellProps<D>,
      T.UseRowStateCellProps<D> {}

  export interface Row<D extends Record<string, unknown> = Record<string, unknown>>
    extends T.UseExpandedRowProps<D>,
      T.UseGroupByRowProps<D>,
      T.UseRowSelectRowProps<D>,
      T.UseRowStateRowProps<D> {}
}
