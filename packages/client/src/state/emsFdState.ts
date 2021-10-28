import create from "zustand";
import type { FullDeputy } from "./dispatchState";

export type ActiveDeputy = FullDeputy;

interface EmsFdState {
  activeDeputy: ActiveDeputy | null;
  setActiveDeputy: (deputy: ActiveDeputy | null) => void;

  deputies: FullDeputy[];
  setDeputies: (deputies: FullDeputy[]) => void;
}

export const useEmsFdState = create<EmsFdState>((set) => ({
  activeDeputy: null,
  setActiveDeputy: (deputy) => set({ activeDeputy: deputy }),

  deputies: [],
  setDeputies: (deputies) => set({ deputies }),
}));
