type DisconnectOrConnect<
  T extends string | object,
  Accessor extends T extends string ? never : keyof T,
> = { disconnect?: { id: T[Accessor] | Accessor } } | { connect?: { id: T[Accessor] | Accessor } };

interface ManyToManyOptions<Accessor> {
  accessor?: Accessor;
}

export function manyToManyHelper<
  T extends string | object,
  Accessor extends T extends string ? never : keyof T,
>(currentArr: T[], incomingArr: T[], options?: ManyToManyOptions<Accessor>) {
  const connectDisconnectArr: DisconnectOrConnect<T, Accessor>[] = [];
  const arr = merge(currentArr, incomingArr);
  const accessor = options?.accessor;

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
