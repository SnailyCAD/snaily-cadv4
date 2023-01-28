import type { CombinedEmsFdUnit, EmsFdDeputy } from "@snailycad/types";
import { create } from "zustand";

export type ActiveDeputy = EmsFdDeputy | CombinedEmsFdUnit;

interface EmsFdState {
  activeDeputy: ActiveDeputy | null;
  setActiveDeputy(deputy: ActiveDeputy | null): void;

  deputies: EmsFdDeputy[];
  setDeputies(deputies: EmsFdDeputy[]): void;
}

export const useEmsFdState = create<EmsFdState>()((set) => ({
  activeDeputy: null,
  setActiveDeputy: (deputy) => set({ activeDeputy: deputy }),

  deputies: [],
  setDeputies: (deputies) => set({ deputies }),
}));
