import * as React from "react";

export type GetIdFromObjFunc<Obj, Id> = (obj: Obj) => Id;
export function useTemporaryItem<Id extends string, Obj extends { id: Id }>(
  data: Obj[],
  getIdFromObj?: GetIdFromObjFunc<Obj, Id>,
) {
  const [tempId, setTempId] = React.useState<Id | null>(null);

  const tempItem = React.useMemo(() => {
    if (!tempId) return null;

    const item = data.find((obj) => {
      const id = getIdFromObj?.(obj) ?? obj["id"];
      return id === tempId;
    });

    return item ?? null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempId, data]);

  const state = {
    tempId,
    setTempId,
  };

  return [tempItem, state] as const;
}
