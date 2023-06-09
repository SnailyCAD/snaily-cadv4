import { Socket } from "socket.io-client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export enum MapItem {
  CALLS,
  UNITS_ONLY,
  BLIPS,
}

interface DispatchMapState {
  hiddenItems: Partial<Record<MapItem, boolean>>;
  setItem(item: MapItem): void;

  currentMapServerURL: string | null;
  setCurrentMapServerURL(url: string): void;
}

interface SocketStore {
  socket: Socket | null;
  setSocket(socket: Socket): void;
}

export const useDispatchMapState = create<DispatchMapState>()(
  persist(
    (set) => ({
      currentMapServerURL: null,
      setCurrentMapServerURL(url) {
        // todo: persist in localstorage
        set({ currentMapServerURL: url });
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
    }),
    {
      name: "dispatch-map-state-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useSocketStore = create<SocketStore>()((set) => ({
  socket: null,
  setSocket(socket) {
    set({ socket });
  },
}));
