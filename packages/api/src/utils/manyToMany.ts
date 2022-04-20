type DisconnectOrConnect<
  T extends string | object,
  Accessor extends T extends string ? never : keyof T,
  DisconnectType extends "disconnect" | "delete" = "disconnect",
> =
  | (DisconnectType extends "disconnect"
      ? { disconnect?: { id: T[Accessor] | Accessor } }
      : { delete?: { id: T[Accessor] | Accessor } })
  | { connect?: { id: T[Accessor] | Accessor } };

type IDisconnectType = "disconnect" | "delete";
interface ManyToManyOptions<DisconnectType extends IDisconnectType, Accessor> {
  disconnectType?: DisconnectType;
  accessor?: Accessor;
}

export function manyToManyHelper<
  T extends string | object,
  Accessor extends T extends string ? never : keyof T,
  DisconnectType extends "disconnect" | "delete" = "disconnect",
>(currentArr: T[], incomingArr: T[], options?: ManyToManyOptions<DisconnectType, Accessor>) {
  const connectDisconnectArr: DisconnectOrConnect<T, Accessor, DisconnectType>[] = [];
  const arr = merge(currentArr, incomingArr);
  const accessor = options?.accessor;
  const disconnectType = options?.disconnectType ?? "disconnect";

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
        [disconnectType]: { id: getAccessor(item, accessor) },
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
