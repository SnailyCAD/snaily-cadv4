import type { PostLeoSearchCitizenData } from "@snailycad/types/api";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export type NameSearchResult = PostLeoSearchCitizenData[number];

interface NameSearchState {
  results: NameSearchResult[] | null | boolean;
  setResults(v: NameSearchResult[] | null | boolean): void;

  currentResult: NameSearchResult | null;
  setCurrentResult(v: NameSearchResult | null): void;
}

export const useNameSearch = createWithEqualityFn<NameSearchState>()(
  (set) => ({
    results: null,
    setResults: (v) => set({ results: v }),

    currentResult: null,
    setCurrentResult: (v) => set({ currentResult: v }),
  }),
  shallow,
);
