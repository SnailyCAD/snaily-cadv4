import type {
  Citizen,
  RegisteredVehicle,
  Warrant,
  Weapon,
  Officer,
  Record,
  CustomFieldValue,
  CustomField,
} from "@snailycad/types";
import create from "zustand";

export interface NameSearchResult extends Citizen {
  vehicles: RegisteredVehicle[];
  weapons: Weapon[];
  Record: Record[];
  warrants: (Warrant & { officer: Officer })[];
  customFields?: CustomFieldValue[];
  allCustomFields?: CustomField[];
}

interface NameSearchState {
  results: NameSearchResult[] | null | boolean;
  setResults(v: NameSearchResult[] | null | boolean): void;

  currentResult: NameSearchResult | null;
  setCurrentResult(v: NameSearchResult | null): void;
}

export const useNameSearch = create<NameSearchState>((set) => ({
  results: null,
  setResults: (v) => set({ results: v }),

  currentResult: null,
  setCurrentResult: (v) => set({ currentResult: v }),
}));
