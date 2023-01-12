import type { PostLeoSearchWeaponData } from "@snailycad/types/api";
import { create } from "zustand";

export type WeaponSearchResult = PostLeoSearchWeaponData;

interface WeaponSearchState {
  currentResult: WeaponSearchResult | null | undefined;
  setCurrentResult(v: WeaponSearchResult | null | undefined): void;
}

export const useWeaponSearch = create<WeaponSearchState>()((set) => ({
  currentResult: undefined,
  setCurrentResult: (v) => set({ currentResult: v }),
}));
