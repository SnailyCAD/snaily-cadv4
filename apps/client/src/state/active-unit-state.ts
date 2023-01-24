import { create } from "zustand";

interface ActiveUnitsState {
  showLeoFilters: boolean;
  showEmsFilters: boolean;
  setShowFilters(type: "leo" | "ems-fd", v: boolean): void;

  leoSearch: string;
  emsSearch: string;
  setSearch(type: keyof Pick<ActiveUnitsState, "emsSearch" | "leoSearch">, value: string): void;
}

export const useActiveUnitsState = create<ActiveUnitsState>()((set) => ({
  showLeoFilters: false,
  showEmsFilters: false,
  setShowFilters: (type, v) => {
    const propName = type === "leo" ? "showLeoFilters" : "showEmsFilters";
    set({ [propName]: v } as unknown as ActiveUnitsState);
  },

  leoSearch: "",
  emsSearch: "",
  setSearch: (type, value) => set({ [type]: value } as unknown as ActiveUnitsState),
}));
