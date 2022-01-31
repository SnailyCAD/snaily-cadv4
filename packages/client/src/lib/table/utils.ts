export function handleCheckboxChange<Id extends string>(
  callId: Id,
  setSelectedRows: React.Dispatch<React.SetStateAction<Id[]>>,
) {
  setSelectedRows((prev) => {
    if (prev.includes(callId)) {
      return prev.filter((v) => v !== callId);
    }

    return [...prev, callId];
  });
}

export function handleAllCheckboxes<Id extends string>(
  setSelectedRows: React.Dispatch<React.SetStateAction<Id[]>>,
  all: { id: Id }[],
) {
  return function (e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;

    if (checked) {
      setSelectedRows(all.map((call) => call.id));
    } else {
      setSelectedRows([]);
    }
  };
}
