import { useRouter } from "next/router";
import * as React from "react";
import { ModalIds } from "types/ModalIds";

interface Context {
  canBeClosed: boolean;
  isOpen: (id: ModalIds) => boolean;
  closeModal: (id: ModalIds) => void;
  openModal: <T = unknown>(id: ModalIds, payload?: T) => void;
  getPayload: <T = unknown>(id: ModalIds) => T | null;
  setCanBeClosed: React.Dispatch<React.SetStateAction<boolean>>;
}

type Payloads = Record<string, any>;
const ModalContext = React.createContext<Context | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState<ModalIds[]>([]);
  const [payloads, setPayloads] = React.useState<Payloads>({});
  const [canBeClosed, setCanBeClosed] = React.useState<boolean>(true);
  const router = useRouter();

  function isOpen(id: ModalIds) {
    return open.includes(id);
  }

  function openModal<T = unknown>(id: ModalIds, payload?: T) {
    if (isOpen(id)) return;

    setPayloads((p) => ({ ...p, [id]: payload }));
    setOpen((p) => [...p, id]);
  }

  function closeModal(id: ModalIds) {
    if (!isOpen(id)) return;

    setPayloads((p) => ({ ...p, [id]: undefined }));
    setOpen((p) => p.filter((v) => v !== id));
  }

  function getPayload(id: ModalIds) {
    return payloads[id];
  }

  const value = {
    canBeClosed,
    isOpen,
    openModal,
    closeModal,
    getPayload,
    setCanBeClosed,
  };

  React.useEffect(() => {
    setOpen([]);
  }, [router.pathname]);

  return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useModal() {
  const context = React.useContext(ModalContext);

  if (!context) {
    throw new Error("`useModal` must be used within a `ModalProvider`");
  }

  return context;
}
