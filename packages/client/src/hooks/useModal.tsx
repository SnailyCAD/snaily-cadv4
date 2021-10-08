import * as React from "react";

interface Context {
  isOpen: (id: string) => boolean;
  closeModal: (id: string) => void;
  openModal: (id: string) => void;
}

const ModalContext = React.createContext<Context | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
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

  const value = {
    isOpen,
    openModal,
    closeModal,
  };

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const context = React.useContext(ModalContext);

  if (!context) {
    throw new Error("`useModal` must be used within a `ModalProvider`");
  }

  return context;
}
