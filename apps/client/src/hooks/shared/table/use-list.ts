import * as React from "react";

interface Options<T> {
  initialData: T[];
  getKey?(item: T): React.Key;
}

export function useList<T>(options: Options<T>) {
  const [items, setItems] = React.useState<T[]>(options.initialData);
  const getKey = options.getKey || _getKey;

  return {
    items,
    ...createListActions({ dispatch: setItems, getKey }),
  };
}

function _getKey<T>(item: T): string {
  return (item as any).id || (item as any).key;
}

export function createListActions<T>({
  dispatch,
  getKey,
}: {
  dispatch: React.Dispatch<React.SetStateAction<T[]>>;
  getKey(item: T): React.Key;
}) {
  return {
    setItems(items: T[]) {
      dispatch(items);
      return items;
    },
    insert(index: number, ...values: T[]) {
      dispatch((items) => insert(items, index, ...values));
    },
    prepend(...values: T[]) {
      dispatch((items) => insert(items, 0, ...values));
    },
    append(...values: T[]) {
      dispatch((items) => insert(items, items.length, ...values));
    },
    remove(...keys: React.Key[]) {
      dispatch((items) => {
        const keySet = new Set(keys);
        const filteredItems = items.filter((item) => !keySet.has(getKey(item)));

        return filteredItems;
      });
    },
    move(key: React.Key, toIndex: number) {
      dispatch((items) => {
        const index = items.findIndex((item) => getKey(item) === key);
        if (index === -1) {
          return items;
        }

        const copy = items.slice();
        const [item] = copy.splice(index, 1);
        copy.splice(toIndex, 0, item!);
        return copy;
      });
    },
    update(key: string, newValue: T) {
      dispatch((items) => {
        const index = items.findIndex((item) => getKey(item) === key);
        if (index === -1) {
          return items;
        }

        return [...items.slice(0, index), newValue, ...items.slice(index + 1)];
      });
    },
  };
}

function insert<T>(items: T[], index: number, ...values: T[]): T[] {
  return [...items.slice(0, index), ...values, ...items.slice(index)];
}
