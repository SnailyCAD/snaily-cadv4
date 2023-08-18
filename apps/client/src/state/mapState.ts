import { ConnectionStatus } from "@snailycad/ui";
import { Socket } from "socket.io-client";
import { SmartSignMarker } from "types/map";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { shallow } from "zustand/shallow";
import { createWithEqualityFn } from "zustand/traditional";

export enum MapItem {
  CALLS,
  UNITS_ONLY,
  BLIPS,
  SMART_SIGNS,
}

interface DispatchMapState {
  smartSigns: SmartSignMarker[];
  setSmartSigns(signs: SmartSignMarker[]): void;

  hiddenItems: Partial<Record<MapItem, boolean>>;
  setItem(item: MapItem): void;

  currentMapServerURL: string | null;
  setCurrentMapServerURL(url: string): void;
}

interface SocketStore {
  socket: Socket | null;
  setSocket(socket: Socket): void;

  status: ConnectionStatus | null;
  setStatus(status: ConnectionStatus): void;
}

export const useDispatchMapState = createWithEqualityFn<DispatchMapState>()(
  persist(
    (set) => ({
      smartSigns: [],
      setSmartSigns(signs) {
        set({ smartSigns: signs });
      },

      currentMapServerURL: null,
      setCurrentMapServerURL(url) {
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
      partialize: (state) => ({
        hiddenItems: state.hiddenItems,
        currentMapServerURL: state.currentMapServerURL,
      }),
      name: "dispatch-map-state-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
  shallow,
);

export const useSocketStore = create<SocketStore>()((set) => ({
  status: null,
  setStatus(status) {
    set({ status });
  },

  socket: null,
  setSocket(socket) {
    set({ socket });
  },
}));
