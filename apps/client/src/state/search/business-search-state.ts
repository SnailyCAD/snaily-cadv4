import type { PostLeoSearchBusinessData } from "@snailycad/types/api";
import { create } from "zustand";

export type BusinessSearchResult = PostLeoSearchBusinessData[number];

interface NameSearchState {
  results: BusinessSearchResult[] | null | boolean;
  setResults(v: BusinessSearchResult[] | null | boolean): void;

  currentResult: BusinessSearchResult | null;
  setCurrentResult(v: BusinessSearchResult | null): void;
}

export const useBusinessSearch = create<NameSearchState>()((set) => ({
  results: null,
  setResults: (v) => set({ results: v }),

  currentResult: null,
  setCurrentResult: (v) => set({ currentResult: v }),
}));
