import * as React from "react";
import type { ModalIds } from "types/ModalIds";
import create from "zustand";

type Payloads = Record<string, any>;

interface ModalState {
  canBeClosed: boolean;
  setCanBeClosed(v: boolean): void;

  open: ModalIds[];
  setOpen(id: ModalIds[]): void;

  payloads: Payloads;
  setPayloads(payload: any): void;
}

interface UseModal extends Pick<ModalState, "canBeClosed" | "setCanBeClosed"> {
  isOpen(id: ModalIds): boolean;
  closeModal(id: ModalIds): void;
  openModal<T = unknown>(id: ModalIds, payload?: T): void;
  getPayload<T = unknown>(id: ModalIds): T | null;
}

export const useModalState = create<ModalState>((set) => ({
  open: [],
  setOpen: (ids) => set({ open: ids }),

  payloads: {},
  setPayloads: (payloads) => set({ payloads }),

  canBeClosed: true,
  setCanBeClosed: (v) => set({ canBeClosed: v }),
}));

export function useModal(): UseModal {
  const modalState = useModalState();

  const isOpen = React.useCallback(
    (id: ModalIds) => {
      return modalState.open.includes(id);
    },
    [modalState.open],
  );

  const getPayload = React.useCallback(
    (id: ModalIds) => {
      return modalState.payloads[id] ?? null;
    },
    [modalState.payloads],
  );

  function openModal<T = unknown>(id: ModalIds, payload?: T) {
    if (isOpen(id)) return;

    modalState.setPayloads({ ...modalState.payloads, [id]: payload });
    modalState.setOpen([...modalState.open, id]);
  }

  function closeModal(id: ModalIds) {
    if (!isOpen(id)) return;

    modalState.setPayloads({ ...modalState.payloads, [id]: undefined });
    modalState.setOpen(modalState.open.filter((v) => v !== id));
  }

  return {
    canBeClosed: modalState.canBeClosed,

    isOpen,
    openModal,
    closeModal,
    getPayload,
    setCanBeClosed: modalState.setCanBeClosed,
  };
}
