import * as React from "react";

type MakeIdFunc<Obj, Id> = (obj: Obj) => Id;

export function useTableSelect<Id extends string, Obj extends { id: Id }>(
  arr: Obj[],
  makeId?: MakeIdFunc<Obj, Id>,
) {
  const [selectedRows, setSelectedRows] = React.useState<Id[]>([]);

  const isTopCheckboxChecked = arr.length > 0 && selectedRows.length === arr.length;
  const isIntermediate = !isTopCheckboxChecked && selectedRows.length > 0;

  function resetRows() {
    setSelectedRows([]);
  }

  function handleCheckboxChange(obj: Obj) {
    const id = makeId?.(obj) ?? obj["id"];

    setSelectedRows((prev) => {
      if (prev.includes(id)) {
        return prev.filter((v) => v !== id);
      }

      return [...prev, id];
    });
  }

  function handleAllCheckboxes(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;

    if (checked) {
      setSelectedRows(arr.map((obj) => makeId?.(obj) ?? obj["id"]));
    } else {
      setSelectedRows([]);
    }
  }

  return {
    selectedRows,
    resetRows,
    isTopCheckboxChecked,
    isIntermediate,
    handleCheckboxChange,
    handleAllCheckboxes,
  };
}
