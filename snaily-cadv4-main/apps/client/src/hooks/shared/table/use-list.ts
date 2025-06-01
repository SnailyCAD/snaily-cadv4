import * as React from "react";

interface Options<T> {
  initialData: T[];
  totalCount: number;
  getKey?(item: T): React.Key;
}

export function useList<T>(options: Options<T>) {
  const [items, setItems] = React.useState<T[]>(options.initialData);
  const [totalCount, setTotalCount] = React.useState(options.totalCount);

  React.useEffect(() => {
    setTotalCount(options.totalCount);
  }, [options.totalCount]);

  const getKey = options.getKey || _getKey;

  return {
    items,
    totalCount,
    ...createListActions({ dispatch: setItems, setTotalCount, getKey }),
  };
}

function _getKey<T>(item: T): string {
  return (item as any).id || (item as any).key;
}

export function createListActions<T>({
  dispatch,
  getKey,
  setTotalCount,
}: {
  dispatch: React.Dispatch<React.SetStateAction<T[]>>;
  setTotalCount: React.Dispatch<React.SetStateAction<number>>;
  getKey(item: T): React.Key;
}) {
  return {
    setItems(items: T[], totalCount?: number) {
      dispatch(items);
      if (typeof totalCount === "number") {
        setTotalCount(totalCount);
      }
      return items;
    },
    insert(index: number, ...values: T[]) {
      dispatch((items) => insert(items, index, ...values));
      setTotalCount((count) => count + values.length);
    },
    prepend(...values: T[]) {
      dispatch((items) => insert(items, 0, ...values));
      setTotalCount((count) => count + values.length);
    },
    append(...values: T[]) {
      dispatch((items) => insert(items, items.length, ...values));
      setTotalCount((count) => count + values.length);
    },
    remove(...keys: React.Key[]) {
      dispatch((items) => {
        const keySet = new Set(keys);
        const filteredItems = items.filter((item) => !keySet.has(getKey(item)));

        return filteredItems;
      });
      setTotalCount((count) => count - keys.length);
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
