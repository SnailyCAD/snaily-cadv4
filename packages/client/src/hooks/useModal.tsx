import * as React from "react";

export function useModal() {
  const [open, setOpen] = React.useState<string[]>([]);

  function isOpen(id: string) {
    return open.includes(id);
  }

  function openModal(id: string) {
    if (isOpen(id)) return;

    setOpen((p) => [...p, id]);
  }

  function closeModal(id: string) {
    if (!isOpen(id)) return;

    setOpen((p) => p.filter((v) => v !== id));
  }

  return {
    isOpen,
    openModal,
    closeModal,
  };
}
