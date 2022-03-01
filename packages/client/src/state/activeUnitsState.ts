import create from "zustand";

interface ActiveUnitsState {
  showFilters: boolean;
  setShowFilters(v: boolean): void;

  leoSearch: string;
  emsSearch: string;
  setSearch(type: keyof Pick<ActiveUnitsState, "emsSearch" | "leoSearch">, value: string): void;
}

export const useActiveUnitsState = create<ActiveUnitsState>((set) => ({
  showFilters: false,
  setShowFilters: (v) => set({ showFilters: v }),

  leoSearch: "",
  emsSearch: "",
  setSearch: (type, value) => set({ [type]: value } as unknown as ActiveUnitsState),
}));
