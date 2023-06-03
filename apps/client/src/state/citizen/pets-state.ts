import type { Pet } from "@snailycad/types";
import { create } from "zustand";

interface PetsState {
  currentPet: Pet | null;
  setCurrentPet(pet: Pet): void;
}

export const usePetsState = create<PetsState>()((set) => ({
  currentPet: null,
  setCurrentPet: (pet) => set({ currentPet: pet }),
}));
