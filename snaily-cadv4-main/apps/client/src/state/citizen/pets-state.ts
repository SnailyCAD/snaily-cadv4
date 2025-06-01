import type { Pet } from "@snailycad/types";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

interface PetsState {
  currentPet: Pet | null;
  setCurrentPet(pet: Pet): void;
}

export const usePetsState = createWithEqualityFn<PetsState>()(
  (set) => ({
    currentPet: null,
    setCurrentPet: (pet) => set({ currentPet: pet }),
  }),
  shallow,
);
