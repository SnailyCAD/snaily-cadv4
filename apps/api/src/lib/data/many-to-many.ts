export type DisconnectOrConnect<
  T extends string | object,
  Accessor extends T extends string ? never : keyof T,
  ShowExisting extends boolean = false,
> = ShowExisting extends false
  ? { disconnect?: { id: T[Accessor] | Accessor } } | { connect?: { id: T[Accessor] | Accessor } }
  :
      | { existing?: { id: T[Accessor] | Accessor } }
      | { disconnect?: { id: T[Accessor] | Accessor } }
      | { connect?: { id: T[Accessor] | Accessor } };

interface ManyToManyOptions<Accessor, ShowExisting extends boolean = false> {
  accessor?: Accessor;
  showExisting?: ShowExisting;
}

export function manyToManyHelper<
  T extends string | object,
  Accessor extends T extends string ? never : keyof T,
  ShowExisting extends boolean = false,
>(currentArr: T[], incomingArr: T[], options?: ManyToManyOptions<Accessor, ShowExisting>) {
  const connectDisconnectArr: DisconnectOrConnect<T, Accessor, ShowExisting>[] = [];
  const arr = merge(currentArr, incomingArr);
  const accessor = options?.accessor;
  const showExisting = options?.showExisting ?? false;

  for (const item of arr) {
    const existsInCurrent = currentArr.some(
      (v) => getAccessor(v, accessor) === getAccessor(item, accessor),
    );

    const existsInIncoming = incomingArr.some(
      (v) => getAccessor(v, accessor) === getAccessor(item, accessor),
    );

    if (!existsInCurrent && existsInIncoming) {
      connectDisconnectArr.push({
        connect: { id: getAccessor(item, accessor) },
      });
      continue;
    }

    if (existsInCurrent && !existsInIncoming) {
      connectDisconnectArr.push({
        disconnect: { id: getAccessor(item, accessor) },
      });
      continue;
    }

    if (existsInCurrent && existsInIncoming && showExisting) {
      // @ts-expect-error this is a false positive
      connectDisconnectArr.push({
        existing: { id: getAccessor(item, accessor) },
      });
      continue;
    }
  }

  return connectDisconnectArr;
}

function getAccessor<
  T extends string | object,
  Accessor extends T extends string ? never : keyof T,
>(v: T, accessor?: Accessor) {
  if (!accessor) return v as unknown as Accessor;
  return typeof v === "string" ? (v as unknown as Accessor) : v[accessor];
}

export function merge<
  T extends string | object,
  Accessor extends T extends string ? never : keyof T,
>(arr1: T[], arr2: T[], accessor?: Accessor) {
  const set = new Set();
  const fullArr = [...arr1, ...arr2];

  const filteredArr = fullArr.filter((el) => {
    const duplicate = set.has(getAccessor(el, accessor));
    set.add(getAccessor(el, accessor));
    return !duplicate;
  });

  return filteredArr;
}

export function getLastOfArray<T>(arr: T[]): T {
  const last = arr[arr.length - 1];
  return last as T;
}
