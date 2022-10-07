import type * as React from "react";
import { ListState, useListState } from "@react-stately/list";
import type { CollectionBase, MultipleSelection, Node } from "@react-types/shared";

export type MultiSelectListProps<T> = CollectionBase<T> & MultipleSelection;

export interface MultiSelectListState<T> extends ListState<T> {
  selectedKeys: Set<React.Key>;
  setSelectedKeys(keys: Iterable<React.Key>): void;
  selectedItems: Node<T>[] | null;
  selectionMode: MultipleSelection["selectionMode"];
}

export function useMultiSelectListState<T extends {}>(
  props: MultiSelectListProps<T>,
): MultiSelectListState<T> {
  const {
    collection,
    disabledKeys,
    selectionManager,
    selectionManager: { setSelectedKeys, selectedKeys, selectionMode },
  } = useListState(props);

  const missingKeys: React.Key[] = [];

  const selectedItems =
    selectedKeys.size !== 0
      ? Array.from(selectedKeys)
          .map((key) => {
            const item = collection.getItem(key);

            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!item) {
              missingKeys.push(key);
            }

            return item;
          })
          // remove undefined values when some keys are not present in the collection
          .filter(Boolean)
      : null;

  if (missingKeys.length) {
    console.warn(
      `Select: Keys "${missingKeys.join(
        ", ",
      )}" passed to "selectedKeys" are not present in the collection.`,
    );
  }

  return {
    collection,
    disabledKeys,
    selectionManager,
    selectionMode,
    selectedKeys,
    setSelectedKeys: setSelectedKeys.bind(selectionManager),
    selectedItems,
  };
}
