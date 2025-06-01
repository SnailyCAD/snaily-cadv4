import type { CombinedEmsFdUnit, EmsFdDeputy } from "@snailycad/types";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export type ActiveDeputy = EmsFdDeputy | CombinedEmsFdUnit;

interface EmsFdState {
  activeDeputy: ActiveDeputy | null;
  setActiveDeputy(deputy: ActiveDeputy | null): void;

  deputies: EmsFdDeputy[];
  setDeputies(deputies: EmsFdDeputy[]): void;
}

export const useEmsFdState = createWithEqualityFn<EmsFdState>()(
  (set) => ({
    activeDeputy: null,
    setActiveDeputy: (deputy) => set({ activeDeputy: deputy }),

    deputies: [],
    setDeputies: (deputies) => set({ deputies }),
  }),
  shallow,
);
