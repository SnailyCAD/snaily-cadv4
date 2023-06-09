import { Socket } from "socket.io-client";
import { create } from "zustand";

export enum MapItem {
  CALLS,
  UNITS_ONLY,
  BLIPS,
}

interface DispatchMapState {
  hiddenItems: Partial<Record<MapItem, boolean>>;
  setItem(item: MapItem): void;

  socket: Socket | null;
  setSocket(socket: Socket): void;

  currentMapServerURL: string | null;
  setCurrentMapServerURL(url: string): void;
}

export const useDispatchMapState = create<DispatchMapState>()((set) => ({
  currentMapServerURL: null,
  setCurrentMapServerURL(url) {
    // todo: persist in localstorage
    set({ currentMapServerURL: url });
  },

  socket: null,
  setSocket(socket) {
    set({ socket });
  },

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
