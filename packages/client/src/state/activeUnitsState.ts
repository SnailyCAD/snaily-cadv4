import create from "zustand";

interface ActiveUnitsState {
  showLeoFilters: boolean;
  showEmsFilters: boolean;
  setShowFilters(type: "leo" | "ems-fd", v: boolean): void;

  leoSearch: string;
  emsSearch: string;
  setSearch(value: string, type: keyof Pick<ActiveUnitsState, "emsSearch">): void;
}

export const useActiveUnitsState = create<ActiveUnitsState>()((set) => ({
  showLeoFilters: false,
  showEmsFilters: false,
  setShowFilters: (type, value) => {
    const propName = type === "leo" ? "showLeoFilters" : "showEmsFilters";
    set({ [propName]: value } as unknown as ActiveUnitsState);
  },

  leoSearch: "",
  emsSearch: "",
  setSearch: (value, type) => set({ [type]: value } as unknown as ActiveUnitsState),
}));
