import type { PostLeoSearchWeaponData } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export type WeaponSearchResult = PostLeoSearchWeaponData;

interface WeaponSearchState {
  currentResult: WeaponSearchResult | null | undefined;
  setCurrentResult(v: WeaponSearchResult | null | undefined): void;
}

export const useWeaponSearch = createWithEqualityFn<WeaponSearchState>()(
  (set) => ({
    currentResult: undefined,
    setCurrentResult: (v) => set({ currentResult: v }),
  }),
  shallow,
);
