import type { PostLeoSearchCitizenData } from "@snailycad/types/api";
import { create } from "zustand";

export type NameSearchResult = PostLeoSearchCitizenData[number];

interface NameSearchState {
  results: NameSearchResult[] | null | boolean;
  setResults(v: NameSearchResult[] | null | boolean): void;

  currentResult: NameSearchResult | null;
  setCurrentResult(v: NameSearchResult | null): void;
}

export const useNameSearch = create<NameSearchState>()((set) => ({
  results: null,
  setResults: (v) => set({ results: v }),

  currentResult: null,
  setCurrentResult: (v) => set({ currentResult: v }),
}));
