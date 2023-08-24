import type { ModalIds } from "types/modal-ids";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

type Payloads = Record<string, unknown>;

interface ModalState {
  canBeClosed: boolean;
  setCanBeClosed(v: boolean): void;

  open: ModalIds[];
  isOpen(id: ModalIds): boolean;
  openModal<T = unknown>(id: ModalIds, payload?: T): void;
  closeModal(id: ModalIds): void;

  payloads: Payloads;
  getPayload<T = unknown>(id: ModalIds): T | null;
  setPayloads(payloads: Payloads): void;
}

export const useModal = createWithEqualityFn<ModalState>()(
  (set, get) => ({
    open: [],
    openModal(id, payload) {
      const state = get();

      const isOpen = state.open.includes(id);
      if (isOpen) return;

      set({ open: [...state.open, id], payloads: { ...state.payloads, [id]: payload } });
    },
    isOpen(id: ModalIds) {
      const state = get();
      return state.open.includes(id);
    },
    closeModal(id) {
      const state = get();

      if (!state.open.includes(id)) return;
      set({
        open: state.open.filter((v) => v !== id),
        payloads: { ...state.payloads, [id]: undefined },
      });
    },

    payloads: {},
    setPayloads: (payloads) => set({ payloads }),
    getPayload<T>(id: ModalIds) {
      const state = get();
      return (state.payloads[id] ?? null) as T | null;
    },

    canBeClosed: true,
    setCanBeClosed: (v) => set({ canBeClosed: v }),
  }),
  shallow,
);
