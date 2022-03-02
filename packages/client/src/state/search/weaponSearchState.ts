import type { Citizen, Weapon, ValueType, Value } from "@snailycad/types";
import create from "zustand";

interface WeaponSearchResult extends Weapon {
  citizen: Citizen;
  registrationStatus: Value<ValueType.LICENSE>;
}

interface WeaponSearchState {
  currentResult: WeaponSearchResult | null | undefined;
  setCurrentResult: (v: WeaponSearchResult | null | undefined) => void;
}

export const useWeaponSearch = create<WeaponSearchState>((set) => ({
  currentResult: undefined,
  setCurrentResult: (v) => set({ currentResult: v }),
}));
