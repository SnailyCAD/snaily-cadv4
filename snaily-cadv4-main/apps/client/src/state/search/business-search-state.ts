import type { PostLeoSearchBusinessData } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export type BusinessSearchResult = PostLeoSearchBusinessData[number];

interface BusinessSearchState {
  results: BusinessSearchResult[] | null | boolean;
  setResults(v: BusinessSearchResult[] | null | boolean): void;

  currentResult: BusinessSearchResult | null;
  setCurrentResult(v: BusinessSearchResult | null): void;
}

export const useBusinessSearch = createWithEqualityFn<BusinessSearchState>()(
  (set) => ({
    results: null,
    setResults: (v) => set({ results: v }),

    currentResult: null,
    setCurrentResult: (v) => set({ currentResult: v }),
  }),
  shallow,
);
