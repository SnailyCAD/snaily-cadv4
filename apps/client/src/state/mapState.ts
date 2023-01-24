import { create } from "zustand";

export enum MapItem {
  CALLS,
  UNITS_ONLY,
  BLIPS,
}

interface DispatchMapState {
  hiddenItems: Partial<Record<MapItem, boolean>>;
  setItem(item: MapItem): void;
}

export const useDispatchMapState = create<DispatchMapState>()((set) => ({
  hiddenItems: { [MapItem.UNITS_ONLY]: true },
  setItem(item) {
    set((state) => ({
      hiddenItems: {
        ...state.hiddenItems,
        [item]: !state.hiddenItems[item],
      },
    }));
  },
}));
