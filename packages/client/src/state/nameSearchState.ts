import { FullRecord } from "components/leo/modals/NameSearchModal/RecordsArea";
import type { Citizen, RegisteredVehicle, Warrant, Weapon } from "types/prisma";
import create from "zustand";
import { FullOfficer } from "./dispatchState";

export interface NameSearchResult extends Citizen {
  vehicles: RegisteredVehicle[];
  weapons: Weapon[];
  Record: FullRecord[];
  warrants: (Warrant & { officer: FullOfficer })[];
}

interface NameSearchState {
  results: NameSearchResult[] | null | boolean;
  setResults: (v: NameSearchResult[] | null | boolean) => void;

  currentResult: NameSearchResult | null;
  setCurrentResult: (v: NameSearchResult | null) => void;
}

export const useNameSearch = create<NameSearchState>((set) => ({
  results: null,
  setResults: (v) => set({ results: v }),

  currentResult: null,
  setCurrentResult: (v) => set({ currentResult: v }),
}));
