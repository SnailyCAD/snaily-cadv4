import type {
  Citizen,
  Weapon,
  ValueType,
  Value,
  CustomField,
  CustomFieldValue,
} from "@snailycad/types";
import create from "zustand";

export interface WeaponSearchResult extends Weapon {
  citizen: Citizen;
  registrationStatus: Value<ValueType.LICENSE>;
  allCustomFields?: CustomField[];
  customFields?: CustomFieldValue[];
}

interface WeaponSearchState {
  currentResult: WeaponSearchResult | null | undefined;
  setCurrentResult(v: WeaponSearchResult | null | undefined): void;
}

export const useWeaponSearch = create<WeaponSearchState>((set) => ({
  currentResult: undefined,
  setCurrentResult: (v) => set({ currentResult: v }),
}));
