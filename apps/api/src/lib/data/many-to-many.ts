export type DisconnectOrConnect<
  T extends string | object,
  ShowUpsert extends boolean = false,
> = ShowUpsert extends false
  ? { disconnect?: { id: string } } | { connect?: { id: string } }
  :
      | {
          upsert?: {
            where: { id: string };
            create: T;
            update: T;
          };
        }
      | { disconnect?: { id: string } }
      | { connect?: { id: string } };

interface ManyToManyOptions<CustomAccessorKey, ShowUpsert extends boolean = false> {
  customAccessorKey?: CustomAccessorKey;
  showUpsert?: ShowUpsert;
}

export function manyToManyHelper<
  ShowUpsert extends boolean,
  T extends ShowUpsert extends true ? { id?: string } : string | { id: string },
  CustomAccessorKey extends T extends string ? never : keyof T,
>(currentArr: T[], incomingArr: T[], options?: ManyToManyOptions<CustomAccessorKey, ShowUpsert>) {
  const connectDisconnectArr: DisconnectOrConnect<T, ShowUpsert>[] = [];
  const accessor = options?.customAccessorKey;
  const showUpsert = options?.showUpsert ?? false;
  const arr = merge(currentArr, incomingArr, accessor, showUpsert);

  for (const item of arr) {
    const existsInCurrent = currentArr.some(
      (v) => getAccessor(v, accessor) === getAccessor(item, accessor),
    );

    const existsInIncoming = incomingArr.some(
      (v) => getAccessor(v, accessor) === getAccessor(item, accessor),
    );

    if (!existsInCurrent && existsInIncoming) {
      const _accessor = getAccessor(item, accessor);

      if (_accessor && !showUpsert) {
        connectDisconnectArr.push({
          connect: { id: _accessor },
        });
        continue;
      }
    }

    if (existsInCurrent && !existsInIncoming) {
      const _accessor = getAccessor(item, accessor);

      if (_accessor) {
        connectDisconnectArr.push({
          disconnect: { id: _accessor },
        });
        continue;
      }
    }

    const _accessor = getAccessor(item, accessor);
    if (showUpsert && typeof item === "object") {
      // @ts-expect-error todo: fix
      connectDisconnectArr.push({
        upsert: {
          create: item,
          update: item,
          where: { id: String(_accessor) },
        },
      });
    }
  }

  return connectDisconnectArr;
}

function getAccessor<
  AllowNull extends boolean,
  T extends AllowNull extends true ? { id?: string } : string | { id: string },
  CustomAccessorKey extends T extends string ? never : keyof T,
>(value: T, customAccessorKey?: CustomAccessorKey) {
  const accessorKey = customAccessorKey ?? "id";

  return typeof value === "string" ? value : value[accessorKey];
}

export function merge<
  AllowNull extends boolean,
  T extends AllowNull extends true ? { id?: string } : string | { id: string },
  Accessor extends T extends string ? never : keyof T,
>(arr1: T[], arr2: T[], accessor?: Accessor, allowNull?: AllowNull) {
  const set = new Set();
  const fullArr = allowNull ? [...arr2, ...arr1] : [...arr1, ...arr2];

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
