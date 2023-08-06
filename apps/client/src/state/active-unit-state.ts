import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

interface ActiveUnitsState {
  showLeoFilters: boolean;
  showEmsFilters: boolean;
  setShowFilters(type: "leo" | "ems-fd", v: boolean): void;

  leoSearch: string;
  emsSearch: string;
  setSearch(type: keyof Pick<ActiveUnitsState, "emsSearch" | "leoSearch">, value: string): void;
}

export const useActiveUnitsState = createWithEqualityFn<ActiveUnitsState>()(
  (set) => ({
    showLeoFilters: false,
    showEmsFilters: false,
    setShowFilters: (type, v) => {
      const propName = type === "leo" ? "showLeoFilters" : "showEmsFilters";
      set({ [propName]: v } as unknown as ActiveUnitsState);
    },

    leoSearch: "",
    emsSearch: "",
    setSearch: (type, value) => set({ [type]: value } as unknown as ActiveUnitsState),
  }),
  shallow,
);
